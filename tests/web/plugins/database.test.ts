import { IDBFactory } from 'fake-indexeddb';
import { DatabasePlugin, promisify } from 'web/plugins/database';

// @ts-ignore
const dbTrigger = jest.spyOn(DatabasePlugin, 'sendData');

afterEach(() => {
  window.indexedDB = new IDBFactory();
  jest.resetAllMocks();
});

describe('Database plugin', () => {
  it('IDBFactory.prototype.deleteDatabase', async () => {
    const db1 = await indexedDB.databases();
    expect(db1.length).toBe(0);

    const db = await promisify(indexedDB.open('blog'));
    const db2 = await indexedDB.databases();
    expect(db2.length).toBe(1);
    // Must call `db.close()` before calling `deleteDatabase`.
    // See https://github.com/dumbmatter/fakeIndexedDB/issues/2#issuecomment-119588557
    db.close();

    new DatabasePlugin().onCreated();

    await promisify(indexedDB.deleteDatabase('blog'));
    const db3 = await indexedDB.databases();
    expect(db3.length).toBe(0);

    expect(dbTrigger).toHaveBeenCalledTimes(1);
  });

  it('IDBObjectStore.prototype: add / put / clear / delete', (done) => {
    // @ts-ignore
    const originAdd = jest.spyOn(IDBObjectStore.prototype, 'add');
    // @ts-ignore
    const originPut = jest.spyOn(IDBObjectStore.prototype, 'put');
    // @ts-ignore
    const originClear = jest.spyOn(IDBObjectStore.prototype, 'clear');
    // @ts-ignore
    const originDelete = jest.spyOn(IDBObjectStore.prototype, 'delete');

    new DatabasePlugin().onCreated();

    const req = indexedDB.open('blog');
    req.addEventListener('upgradeneeded', () => {
      const db = req.result;
      db.createObjectStore('posts', { autoIncrement: true });
    });
    req.addEventListener('success', async () => {
      const db = req.result;
      const store = db.transaction('posts', 'readwrite').objectStore('posts');
      await promisify(store.add(123));
      await promisify(store.put(456));
      const data1 = await promisify(store.getAll());
      expect(data1.length).toBe(2);
      expect(originAdd).toHaveBeenCalledTimes(1);
      expect(originPut).toHaveBeenCalledTimes(1);

      await promisify(store.delete(1));
      const data2 = await promisify(store.getAll());
      expect(data2.length).toBe(1);
      expect(originDelete).toHaveBeenCalledTimes(1);

      await promisify(store.clear());
      const data3 = await promisify(store.getAll());
      expect(data3.length).toBe(0);
      expect(originClear).toHaveBeenCalledTimes(1);

      expect(dbTrigger).toHaveBeenCalledTimes(4);

      done();
    });
  });
});
