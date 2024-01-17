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

const DB_NAME = 'page-spy';
const STORE_NAME = 'data-harbor';
const INDEXEDDB_SUPPORTED = IDBFactory && IDBObjectStore && window.indexedDB;

export default class Harbor {
  constructor() {
    if (INDEXEDDB_SUPPORTED) {
      const req = window.indexedDB.open(DB_NAME);
      req.addEventListener('upgradeneeded', (evt) => {
        const db = (evt.target as IDBRequest).result;
        db.createObjectStore(STORE_NAME, { autoIncrement: true });
      });
    }
  }

  get database() {
    return promisify(window.indexedDB.open(DB_NAME));
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
      return key;
    } catch (e) {
      return null;
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

  public async clear() {
    try {
      const store = await this.getStore('readwrite');
      await promisify(store.clear());
      return true;
    } catch (e) {
      return false;
    }
  }

  public async drop() {
    try {
      const result = await promisify(window.indexedDB.deleteDatabase(DB_NAME));
      return result;
    } catch (e) {
      return false;
    }
  }
}
