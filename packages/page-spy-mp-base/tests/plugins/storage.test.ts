import StoragePlugin, {
  mpDataStringify,
} from 'page-spy-mp-base/src/plugins/storage';
import { mp } from '../setup';
import { OnInitParams, SpyMP } from 'packages/page-spy-types';
import { atom } from 'page-spy-base/src';
import { Config } from 'page-spy-mp-base/src/config';
import socket from 'page-spy-mp-base/src/helpers/socket';

const initParams = {
  config: new Config().mergeConfig({ api: 'example.com' }),
  socketStore: socket,
  atom,
} as OnInitParams<SpyMP.MPInitConfig>;
const sleep = (t = 100) => new Promise((r) => setTimeout(r, t));

const trigger = jest.spyOn(StoragePlugin.prototype, 'sendStorageItem');

const plugin = new StoragePlugin();

beforeEach(() => {
  plugin.onInit(initParams);
});
afterEach(() => {
  trigger.mockReset();
  plugin.onReset();
  // console.log(trigger.mock);
});

describe('Storage data stringify', () => {
  it('mini program auto stringify object', () => {
    expect(mpDataStringify(1)).toBe('1');
    expect(mpDataStringify(true)).toBe('true');
    expect(mpDataStringify('pagespy')).toBe('pagespy');
    expect(mpDataStringify({ aaa: 'bbb' })).toBe('{"aaa":"bbb"}');
    const date = new Date();
    expect(mpDataStringify(date)).toBe(date.toDateString());
    expect(mpDataStringify(null)).toBe('null');
    expect(mpDataStringify(undefined)).toBe(undefined);
  });
});

describe('Storage plugin', () => {
  it('set storage async', async () => {
    mp.setStorage({ key: '1', data: '1' });
    mp.setStorage({ key: '2', data: '2' });
    mp.batchSetStorage({
      kvList: [
        { key: '3', value: '3' },
        { key: '4', value: '4' },
      ],
    });
    await sleep();
    expect(trigger).toHaveBeenCalledTimes(4);
    expect(trigger).lastCalledWith(
      expect.objectContaining({
        type: 'mpStorage',
        action: 'set',
      }),
    );
  });
  it('set storage sync', () => {
    mp.setStorageSync('3', '3');
    mp.setStorageSync('3', '4');
    mp.batchSetStorageSync([
      { key: '3', value: '3' },
      { key: '4', value: '4' },
    ]);

    expect(trigger).toHaveBeenCalledTimes(4);
    expect(trigger).lastCalledWith(
      expect.objectContaining({
        type: 'mpStorage',
        action: 'set',
      }),
    );
  });

  it('remove storage async', async () => {
    mp.removeStorage({ key: '1' });
    mp.removeStorage({ key: '2' });
    await sleep();
    expect(trigger).toHaveBeenCalledTimes(2);
    expect(trigger).lastCalledWith(
      expect.objectContaining({
        type: 'mpStorage',
        action: 'remove',
      }),
    );
  });

  it('remove storage sync', () => {
    mp.removeStorageSync('1');
    mp.removeStorageSync('2');
    expect(trigger).toHaveBeenCalledTimes(2);
    expect(trigger).lastCalledWith(
      expect.objectContaining({
        type: 'mpStorage',
        action: 'remove',
      }),
    );
  });

  it('clear storage', async () => {
    mp.clearStorageSync();
    mp.clearStorage({});
    await sleep();
    expect(trigger).toHaveBeenCalledTimes(2);
    expect(trigger).lastCalledWith(
      expect.objectContaining({
        type: 'mpStorage',
        action: 'clear',
      }),
    );
  });

  it('Send refresh all storage', async () => {
    plugin.sendRefresh();
    expect(trigger).toHaveBeenCalledTimes(1);
    expect(trigger).lastCalledWith(
      expect.objectContaining({
        type: 'mpStorage',
        action: 'get',
      }),
    );
  });
  // await cookieStore.delete('1');
  // await cookieStore.delete('2');
  // expect(trigger).toHaveBeenCalledTimes(4);
  // expect(trigger).lastCalledWith(
  //   expect.objectContaining({
  //     type: 'cookie',
  //     action: 'remove',
  //   }),
  // );
  // localStorage.setItem('1', '1');
  // localStorage.removeItem('1');
  // expect(trigger).toHaveBeenCalledTimes(6);
  // expect(trigger).lastCalledWith(
  //   expect.objectContaining({
  //     type: 'localStorage',
  //     action: 'remove',
  //   }),
  // );
  // sessionStorage.setItem('2', '2');
  // sessionStorage.removeItem('2');
  // expect(trigger).toHaveBeenCalledTimes(8);
  // expect(trigger).lastCalledWith(
  //   expect.objectContaining({
  //     type: 'sessionStorage',
  //     action: 'remove',
  //   }),
  // );
  // localStorage.clear();
  // expect(trigger).lastCalledWith(
  //   expect.objectContaining({
  //     type: 'localStorage',
  //     action: 'clear',
  //   }),
  // );
  // expect(trigger).toHaveBeenCalledTimes(9);
  // sessionStorage.clear();
  // expect(trigger).lastCalledWith(
  //   expect.objectContaining({
  //     type: 'sessionStorage',
  //     action: 'clear',
  //   }),
  // );
  // expect(trigger).toHaveBeenCalledTimes(10);

  // it('Special keys in Storage', () => {
  //   const keys = ['key', 'setItem', 'getItem', 'removeItem', 'clear'];

  //   keys.forEach((k) => {
  //     localStorage.setItem(k, k);
  //   });

  //   expect(trigger).toHaveBeenCalledTimes(5);
  //   // @ts-ignore
  //   const storage = StoragePlugin.takeStorage('localStorage');
  //   expect(storage.data.length).toBe(5);
  //   // expect(storage.data.map((i) => i.name)).toEqual(keys);
  // });
});
