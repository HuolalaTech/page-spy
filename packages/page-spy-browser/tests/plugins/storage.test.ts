import { StoragePlugin } from 'page-spy-browser/src/plugins/storage';

// @ts-ignore
const trigger = jest.spyOn(StoragePlugin, 'sendStorageItem');
const sleep = (t = 100) => new Promise((r) => setTimeout(r, t));

beforeAll(() => {
  new StoragePlugin().onInit();
});
afterEach(() => {
  localStorage.clear();
  sessionStorage.clear();
  document.cookie = '';
  trigger.mockReset();
  // console.log(trigger.mock);
});

describe('Storage plugin', () => {
  it('cookieStore / localStorage /sessionStorage', async () => {
    await cookieStore.set('1', '1');
    await cookieStore.set('2', '2');
    expect(trigger).toHaveBeenCalledTimes(2);
    expect(trigger).lastCalledWith(
      expect.objectContaining({
        type: 'cookie',
        action: 'set',
      }),
    );
    await cookieStore.delete('1');
    await cookieStore.delete('2');
    expect(trigger).toHaveBeenCalledTimes(4);
    expect(trigger).lastCalledWith(
      expect.objectContaining({
        type: 'cookie',
        action: 'remove',
      }),
    );
    localStorage.setItem('1', '1');
    localStorage.removeItem('1');
    expect(trigger).toHaveBeenCalledTimes(6);
    expect(trigger).lastCalledWith(
      expect.objectContaining({
        type: 'localStorage',
        action: 'remove',
      }),
    );
    sessionStorage.setItem('2', '2');
    sessionStorage.removeItem('2');
    expect(trigger).toHaveBeenCalledTimes(8);
    expect(trigger).lastCalledWith(
      expect.objectContaining({
        type: 'sessionStorage',
        action: 'remove',
      }),
    );
    localStorage.clear();
    expect(trigger).lastCalledWith(
      expect.objectContaining({
        type: 'localStorage',
        action: 'clear',
      }),
    );
    expect(trigger).toHaveBeenCalledTimes(9);
    sessionStorage.clear();
    expect(trigger).lastCalledWith(
      expect.objectContaining({
        type: 'sessionStorage',
        action: 'clear',
      }),
    );
    expect(trigger).toHaveBeenCalledTimes(10);
  });

  it('Special keys in Storage', () => {
    const keys = ['key', 'setItem', 'getItem', 'removeItem', 'clear'];

    keys.forEach((k) => {
      localStorage.setItem(k, k);
    });

    expect(trigger).toHaveBeenCalledTimes(5);
    // @ts-ignore
    const storage = StoragePlugin.takeStorage('localStorage');
    expect(storage.data.length).toBe(5);
    expect(storage.data.map((i) => i.name)).toEqual(keys);
  });

  it('Response refresh event', async () => {
    StoragePlugin.sendRefresh('sessionStorage');
    StoragePlugin.sendRefresh('cookie');
    StoragePlugin.sendRefresh('localStorage');

    await sleep();

    expect(trigger).toHaveBeenCalledTimes(3);
    expect(trigger).lastCalledWith(
      expect.objectContaining({
        type: 'cookie',
        action: 'get',
      }),
    );
  });
});
