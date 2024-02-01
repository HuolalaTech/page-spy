import { psLog } from 'base/src';
import {
  Container,
  PRIVATE_DB_NAME,
  INDEXEDDB_SUPPORTED,
  STORE_NAME,
} from './base';

/* eslint-disable @typescript-eslint/no-use-before-define */
const promisify = <T>(request: IDBRequest<T>): Promise<T> => {
  return new Promise((resolve, reject) => {
    function unlisten() {
      request.removeEventListener('success', successHandler);
      request.removeEventListener('error', errorHandler);
    }
    function successHandler() {
      resolve(request.result);
      unlisten();
    }
    function errorHandler() {
      reject(request.error);
      unlisten();
    }
    request.addEventListener('success', successHandler);
    request.addEventListener('error', errorHandler);
  });
};

export const IDB_ERROR_COUNT = -1;

export default class IDBContainer implements Container {
  public async init() {
    if (INDEXEDDB_SUPPORTED) {
      const req = window.indexedDB.open(PRIVATE_DB_NAME);
      req.addEventListener('upgradeneeded', (evt) => {
        const db = (evt.target as IDBRequest<IDBDatabase>).result;
        db.createObjectStore(STORE_NAME, { autoIncrement: true });
      });
      req.addEventListener('blocked', (evt) => {
        psLog.warn('[IDBContainer] open database blocked: ', {
          oldVersion: evt.oldVersion,
          newVersion: evt.newVersion,
        });
      });
      try {
        await promisify(req);
        return true;
      } catch (e) {
        return false;
      }
    }
    return false;
  }

  get database() {
    return promisify(window.indexedDB.open(PRIVATE_DB_NAME));
  }

  async getStore(mode: IDBTransactionMode = 'readonly') {
    const db = await this.database;
    const store = db.transaction(STORE_NAME, mode).objectStore(STORE_NAME);
    return store;
  }

  public async add(data: any) {
    try {
      const store = await this.getStore('readwrite');
      const key = await promisify(store.add(data));
      return key as number;
    } catch (e) {
      return IDB_ERROR_COUNT;
    }
  }

  public async getAll() {
    try {
      const store = await this.getStore();
      const data = await promisify(store.getAll());
      return data;
    } catch (e) {
      return [];
    }
  }

  public async count() {
    try {
      const store = await this.getStore();
      const count = await promisify(store.count());
      return count;
    } catch (e) {
      return IDB_ERROR_COUNT;
    }
  }

  public async clear() {
    try {
      const store = await this.getStore('readwrite');
      await promisify(store.clear());
    } catch (e: any) {
      psLog.error(
        `idbContainer.clear() failed. The error detail: ${e.message}`,
      );
    }
  }

  public async drop() {
    try {
      await promisify(window.indexedDB.deleteDatabase(PRIVATE_DB_NAME));
    } catch (e: any) {
      //
    }
  }
}
