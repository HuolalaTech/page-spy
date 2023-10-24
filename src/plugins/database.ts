import { DBInfo, DBStoreInfo } from 'types/lib/database';
import { psLog } from 'src/utils';
import socketStore from 'src/utils/socket';
import { DEBUG_MESSAGE_TYPE } from 'src/utils/message';
import PageSpyPlugin from '.';

export class DatabasePlugin implements PageSpyPlugin {
  public name = 'DatabasePlugin';

  public static hasInitd = false;

  // eslint-disable-next-line class-methods-use-this
  public async onCreated() {
    if (DatabasePlugin.hasInitd) return;
    DatabasePlugin.hasInitd = true;

    DatabasePlugin.listenEvent();
  }

  private static listenEvent() {
    socketStore.addListener(DEBUG_MESSAGE_TYPE.REFRESH, ({ source }) => {
      switch (source.data) {
        default:
          break;
      }
    });
  }

  private static async takeDBResult() {
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
    return data;
  }

  private static async getDBData(info: Required<IDBDatabaseInfo>) {
    try {
      const result: DBInfo = {
        database: info.name,
        version: info.version,
        stores: [],
      };
      const db = await this.promisify(
        window.indexedDB.open(info.name, info.version),
      );
      if (db.objectStoreNames.length) {
        const storeList = [...db.objectStoreNames].map((i) => {
          return db.transaction(i, 'readonly').objectStore(i);
        });
        result.stores = await Promise.all(
          storeList.map(async (store) => {
            const { name, keyPath, autoIncrement, indexNames } = store;
            const storeData = await this.promisify(store.getAll());
            const data: DBStoreInfo = {
              name,
              keyPath,
              autoIncrement,
              indexes: [...indexNames],
              data: storeData,
            };
            return data;
          }),
        );
      }
      return result;
    } catch (e: any) {
      psLog.error(`Failed to get indexedDB data, more info: ${e.message}`);
      return null;
    }
  }

  private static promisify<T = any>(req: IDBRequest<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      req.addEventListener('success', () => {
        resolve(req.result);
      });
      req.addEventListener('error', () => {
        reject();
      });
    });
  }
}
