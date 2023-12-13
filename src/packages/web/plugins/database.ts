import { DBInfo, DBStoreInfo } from 'types/lib/database';
import { psLog } from 'src/utils';
import socketStore from 'web/helpers/socket';
import { DEBUG_MESSAGE_TYPE, makeMessage } from 'src/utils/message';
import { SpyDatabase } from 'types';
import PageSpyPlugin from 'src/utils/plugin';

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

  private static get isSupport() {
    if (!IDBFactory || !IDBObjectStore || !window.indexedDB) return false;
    return true;
  }

  // eslint-disable-next-line class-methods-use-this
  public onCreated() {
    if (!DatabasePlugin.isSupport) return;

    if (DatabasePlugin.hasInitd) return;
    DatabasePlugin.hasInitd = true;

    DatabasePlugin.listenEvents();
    DatabasePlugin.initIndexedDBProxy();
  }

  private static listenEvents() {
    socketStore.addListener(DEBUG_MESSAGE_TYPE.REFRESH, async ({ source }) => {
      if (source.data === 'indexedDB') {
        const result = await this.takeBasicInfo();
        const data: SpyDatabase.BasicTypeDataItem = {
          action: 'basic',
          result,
        };
        DatabasePlugin.sendData(data);
      }
    });
    socketStore.addListener(
      DEBUG_MESSAGE_TYPE.DATABASE_PAGINATION,
      async ({ source }) => {
        const { db, store, page } = source.data;
        const result = await DatabasePlugin.getStoreDataWithPagination({
          db,
          store,
          page,
        });
        DatabasePlugin.sendData(result);
      },
    );
  }

  private static initIndexedDBProxy() {
    const {
      put: originPut,
      add: originAdd,
      delete: originDelete,
      clear: originClear,
    } = IDBObjectStore.prototype;
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
    const data = makeMessage(DEBUG_MESSAGE_TYPE.DATABASE, info);
    // The user wouldn't want to get the stale data, so here we set the 2nd parameter to true.
    socketStore.broadcastMessage(data, true);
  }
}
