import StoragePlugin, { mpDataStringify } from 'src/plugins/storage';
import { initStorageMock } from '../mock/storage';

const sleep = (t = 100) => new Promise((r) => setTimeout(r, t));

// @ts-ignore
const trigger = jest.spyOn(StoragePlugin, 'sendStorageItem');

beforeAll(() => {
  initStorageMock();
  new StoragePlugin().onCreated();
});

afterEach(() => {
  trigger.mockReset();
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
    wx.setStorage({ key: '1', data: '1' });
    wx.setStorage({ key: '2', data: '2' });
    wx.batchSetStorage({
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
    wx.setStorageSync('3', '3');
    wx.setStorageSync('3', '4');
    wx.batchSetStorageSync([
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
    wx.removeStorage({ key: '1' });
    wx.removeStorage({ key: '2' });
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
    wx.removeStorageSync('1');
    wx.removeStorageSync('2');
    expect(trigger).toHaveBeenCalledTimes(2);
    expect(trigger).lastCalledWith(
      expect.objectContaining({
        type: 'mpStorage',
        action: 'remove',
      }),
    );
  });

  it('clear storage', async () => {
    wx.clearStorageSync();
    wx.clearStorage({});
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
    StoragePlugin.sendRefresh();
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
