import { IDBFactory } from 'fake-indexeddb';
import { psLog } from '@huolala-tech/page-spy-base';
import {
  DatabasePlugin,
  promisify,
} from 'page-spy-browser/src/plugins/database';
import socket from 'page-spy-browser/src/helpers/socket';
import { OnInitParams } from 'packages/page-spy-types';
import { Config, InitConfig } from 'page-spy-browser/src/config';
import { atom } from 'page-spy-base/dist/atom';

const initParams = {
  config: new Config().mergeConfig({}),
  socketStore: socket,
  atom,
} as OnInitParams<InitConfig>;
const sleep = (t = 100) => new Promise((r) => setTimeout(r, t));
// @ts-ignore
const dbTrigger = jest.spyOn(DatabasePlugin.prototype, 'sendData');

// init indexedDB store and fill data
beforeEach(async () => {
  const req = window.indexedDB.open('blog', 1);
  req.addEventListener('upgradeneeded', () => {
    const db = req.result;
    db.createObjectStore('posts', { autoIncrement: true });
  });
  const db = await promisify(req);
  const store = db.transaction('posts', 'readwrite').objectStore('posts');
  const storeTasks = Array(100)
    .fill(0)
    .map((i) => promisify(store.add(i)));
  await Promise.all(storeTasks);

  // Must call `db.close()` before calling `deleteDatabase`.
  // See https://github.com/dumbmatter/fakeIndexedDB/issues/2#issuecomment-119588557
  db.close();
  jest.resetAllMocks();
});
afterEach(async () => {
  await promisify(window.indexedDB.deleteDatabase('blog'));
});

describe('Database plugin', () => {
  it('If not support indexedDB', () => {
    const originFn = window.indexedDB.databases;
    Object.assign(window.indexedDB, {
      databases: undefined,
    });

    expect(DatabasePlugin.isSupport).toBe(false);

    new DatabasePlugin().onInit(initParams);

    expect(DatabasePlugin.hasInitd).toBe(false);

    window.indexedDB.databases = originFn;
  });

  it('reports non-Error failures while reading database metadata', async () => {
    const error = jest.spyOn(psLog, 'error').mockImplementation();
    const open = jest.spyOn(window.indexedDB, 'open').mockImplementation(() => {
      throw 'database unavailable';
    });

    try {
      await expect(
        new DatabasePlugin().getDBData({ name: 'blog', version: 1 }),
      ).resolves.toBeNull();
      expect(error).toHaveBeenCalledWith(
        'Failed to get indexedDB data, more info: database unavailable',
      );
    } finally {
      open.mockRestore();
      error.mockRestore();
    }
  });

  it('IDBFactory.prototype.deleteDatabase', async () => {
    const db = await indexedDB.databases();
    expect(db.length).toBe(1);

    new DatabasePlugin().onInit(initParams);

    await promisify(indexedDB.deleteDatabase('blog'));
    const db2 = await indexedDB.databases();
    expect(db2.length).toBe(0);

    expect(dbTrigger).toHaveBeenCalledTimes(1);
  });

  it('IDBObjectStore.prototype: add / put / clear / delete', async () => {
    // @ts-ignore
    const originAdd = jest.spyOn(IDBObjectStore.prototype, 'add');
    // @ts-ignore
    const originPut = jest.spyOn(IDBObjectStore.prototype, 'put');
    // @ts-ignore
    const originClear = jest.spyOn(IDBObjectStore.prototype, 'clear');
    // @ts-ignore
    const originDelete = jest.spyOn(IDBObjectStore.prototype, 'delete');

    new DatabasePlugin().onInit(initParams);

    const db = await promisify(window.indexedDB.open('blog'));
    const store = db.transaction('posts', 'readwrite').objectStore('posts');

    await promisify(store.add(123));
    await promisify(store.put(456));
    await promisify(store.getAll());
    expect(originAdd).toHaveBeenCalledTimes(1);
    expect(originPut).toHaveBeenCalledTimes(1);

    await promisify(store.delete(1));
    await promisify(store.getAll());
    expect(originDelete).toHaveBeenCalledTimes(1);

    await promisify(store.clear());
    await promisify(store.getAll());
    expect(originClear).toHaveBeenCalledTimes(1);

    expect(dbTrigger).toHaveBeenCalledTimes(4);
    db.close();
  });

  it('DATABASE_PAGINATION event and REFRESH event', async () => {
    new DatabasePlugin().onInit(initParams);

    // @ts-ignore
    socket.dispatchEvent('refresh', {
      source: {
        type: 'refresh',
        data: 'indexedDB',
      },
    });
    // @ts-ignore
    socket.dispatchEvent('database-pagination', {
      source: {
        type: 'database-pagination',
        data: {
          db: 'blog',
          store: 'posts',
          page: 2,
        },
      },
    });

    await sleep(1000);

    expect(dbTrigger).toHaveBeenCalledTimes(2);
  });
});
