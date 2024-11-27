import { OnInitParams } from 'packages/page-spy-types';
import { atom } from 'page-spy-base/dist/atom';
import { Config, InitConfig } from 'page-spy-browser/src/config';
import socket from 'page-spy-browser/src/helpers/socket';
import { StoragePlugin } from 'page-spy-browser/src/plugins/storage';

const initParams = {
  config: new Config().mergeConfig({}),
  socketStore: socket,
  atom,
} as OnInitParams<InitConfig>;
const trigger = jest.spyOn(StoragePlugin.prototype, 'sendStorageItem');
const storageInstance = new StoragePlugin();
const sleep = (t = 100) => new Promise((r) => setTimeout(r, t));

beforeAll(() => {
  storageInstance.onInit(initParams);
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
    const storage = storageInstance.takeStorage('localStorage');
    expect(storage.data.length).toBe(5);
    expect(storage.data.map((i) => i.name)).toEqual(keys);
  });

  it('Response refresh event', async () => {
    storageInstance.sendRefresh('sessionStorage');
    storageInstance.sendRefresh('cookie');
    storageInstance.sendRefresh('localStorage');

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
