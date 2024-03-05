import { DBInfo, DBStoreInfo } from '@huolala-tech/page-spy-types/lib/database';
import { psLog } from 'base/src';
import socketStore from 'page-spy-browser/src/helpers/socket';
import { makeMessage } from 'base/src/message';
import { SpyDatabase, PageSpyPlugin } from '@huolala-tech/page-spy-types';

export function promisify<T = any>(req: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    req.addEventListener('success', () => {
      resolve(req.result);
    });
    req.addEventListener('error', () => {
      reject();
    });
  });
}

export class DatabasePlugin implements PageSpyPlugin {
  public name = 'DatabasePlugin';

  public static hasInitd = false;

  private originAdd: IDBObjectStore['add'] | null = null;

  private originPut: IDBObjectStore['put'] | null = null;

  private originDelete: IDBObjectStore['delete'] | null = null;

  private originClear: IDBObjectStore['clear'] | null = null;

  private originDrop: IDBFactory['deleteDatabase'] | null = null;

  public static get isSupport() {
    if (
      !IDBFactory ||
      !IDBObjectStore ||
      !window.indexedDB ||
      !window.indexedDB.databases
    ) {
      return false;
    }
    return true;
  }

  // eslint-disable-next-line class-methods-use-this
  public onInit() {
    if (!DatabasePlugin.isSupport) return;

    if (DatabasePlugin.hasInitd) return;
    DatabasePlugin.hasInitd = true;

    DatabasePlugin.listenEvents();
    this.initIndexedDBProxy();
  }

  public onReset() {
    if (this.originAdd) {
      IDBObjectStore.prototype.add = this.originAdd;
    }
    if (this.originPut) {
      IDBObjectStore.prototype.put = this.originPut;
    }
    if (this.originClear) {
      IDBObjectStore.prototype.clear = this.originClear;
    }
    if (this.originDelete) {
      IDBObjectStore.prototype.delete = this.originDelete;
    }
    if (this.originDrop) {
      IDBFactory.prototype.deleteDatabase = this.originDrop;
    }
    DatabasePlugin.hasInitd = false;
  }

  private static listenEvents() {
    socketStore.addListener('refresh', async ({ source }) => {
      if (source.data === 'indexedDB') {
        const result = await this.takeBasicInfo();
        const data: SpyDatabase.BasicTypeDataItem = {
          action: 'basic',
          result,
        };
        DatabasePlugin.sendData(data);
      }
    });
    socketStore.addListener('database-pagination', async ({ source }) => {
      const { db, store, page } = source.data;
      const result = await DatabasePlugin.getStoreDataWithPagination({
        db,
        store,
        page,
      });
      DatabasePlugin.sendData(result);
    });
  }

  private initIndexedDBProxy() {
    const {
      put: originPut,
      add: originAdd,
      delete: originDelete,
      clear: originClear,
    } = IDBObjectStore.prototype;

    this.originAdd = originAdd;
    this.originPut = originPut;
    this.originDelete = originDelete;
    this.originClear = originClear;

    const { sendData } = DatabasePlugin;

    const originProxyList = [
      {
        origin: originPut,
        method: 'put',
      },
      {
        origin: originAdd,
        method: 'add',
      },
      {
        origin: originDelete,
        method: 'delete',
      },
      {
        origin: originClear,
        method: 'clear',
      },
    ] as const;

    originProxyList.forEach(({ origin, method }) => {
      IDBObjectStore.prototype[method] = function (...args: any) {
        const req = (origin as any).apply(this, args);
        const data = {
          action: method === 'clear' ? 'clear' : 'update',
          database: this.transaction.db.name,
          store: this.name,
        } as const;
        req.addEventListener('success', () => {
          sendData(data);
        });
        return req;
      };
    });

    const originDrop = IDBFactory.prototype.deleteDatabase;
    this.originDrop = originDrop;

    IDBFactory.prototype.deleteDatabase = function (name: string) {
      const req = originDrop.call(this, name);
      const data: SpyDatabase.DropTypeDataItem = {
        action: 'drop',
        database: name,
      };
      req.addEventListener('success', () => {
        sendData(data);
      });
      return req;
    };
  }

  private static async takeBasicInfo() {
    const dbs = await window.indexedDB.databases();
    if (!dbs.length) {
      return null;
    }
    const validDBs = dbs.filter(
      (i) => i.name && i.version,
    ) as Required<IDBDatabaseInfo>[];
    if (!validDBs.length) return null;

    const data = await Promise.all(
      validDBs.map((i) => DatabasePlugin.getDBData(i)),
    );
    return data.filter(Boolean) as DBInfo[];
  }

  private static async getDBData(info: Required<IDBDatabaseInfo>) {
    try {
      const result: DBInfo = {
        name: info.name,
        version: info.version,
        stores: [],
      };
      const db = await promisify(
        window.indexedDB.open(info.name, info.version),
      );
      if (db.objectStoreNames.length) {
        const storeList = [...db.objectStoreNames].map((i) => {
          return db.transaction(i, 'readonly').objectStore(i);
        });
        result.stores = storeList.map((store) => {
          const { name, keyPath, autoIncrement, indexNames } = store;
          const data: DBStoreInfo = {
            name,
            keyPath,
            autoIncrement,
            indexes: [...indexNames],
          };
          return data;
        });
      }
      return result;
    } catch (e: any) {
      psLog.error(`Failed to get indexedDB data, more info: ${e.message}`);
      return null;
    }
  }

  private static async getStoreDataWithPagination({
    db,
    store,
    page,
  }: {
    db: string;
    store: string;
    page: number;
  }): Promise<SpyDatabase.GetTypeDataItem> {
    const result: SpyDatabase.GetTypeDataItem = {
      action: 'get',
      database: null,
      store: null,
      page: {
        current: page,
        prev: null,
        next: null,
      },
      total: 0,
      data: [],
    };
    if (page < 1) return result;
    const database = await promisify(window.indexedDB.open(db));
    const objStore = database.transaction(store, 'readonly').objectStore(store);
    result.database = {
      name: database.name,
      version: database.version,
    };
    result.store = {
      name: objStore.name,
      keyPath: objStore.keyPath,
      autoIncrement: objStore.autoIncrement,
      indexes: [...objStore.indexNames],
    };
    result.total = await promisify(objStore.count());

    const lowerBound = 50 * (page - 1);
    const upperBound = 50 * page;
    result.page.prev = page > 1 ? page - 1 : null;
    result.page.next = lowerBound + 50 < result.total ? page + 1 : null;

    let currentIndex = 0;
    const cursorRequest = objStore.openCursor();
    return new Promise((resolve, reject) => {
      cursorRequest.addEventListener('success', () => {
        const cursor = cursorRequest.result;
        if (cursor) {
          if (currentIndex >= lowerBound && currentIndex < upperBound) {
            result.data.push({ key: cursor.key, value: cursor.value });
          }
          currentIndex++;
          cursor.continue();
        } else {
          resolve(result);
        }
      });
      cursorRequest.addEventListener('error', reject);
    });
  }

  private static sendData(info: Omit<SpyDatabase.DataItem, 'id'>) {
    const data = makeMessage('database', info);
    // The user wouldn't want to get the stale data, so here we set the 2nd parameter to true.
    socketStore.broadcastMessage(data, true);

    if (['update', 'clear', 'drop'].includes(info.action)) {
      socketStore.dispatchEvent('public-data', data);
    }
  }
}
