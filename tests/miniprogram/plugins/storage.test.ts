import { StoragePlugin } from 'src/packages/miniprogram/plugins/storage';

const sleep = (t = 100) => new Promise((r) => setTimeout(r, t));

beforeAll(() => {});
afterEach(() => {
  // trigger.mockReset();
  // console.log(trigger.mock);
});

describe('Storage plugin', () => {
  it('mp storage', async () => {
    new StoragePlugin().onCreated();
    // @ts-ignore
    const trigger = jest.spyOn(StoragePlugin, 'sendStorageItem');

    // console.log('wxxxx',wx)
    wx.setStorage({ key: '1', data: '1' });
    wx.setStorage({ key: '2', data: '2' });
    await sleep(1000);
    // await cookieStore.set('1', '1');
    // await cookieStore.set('2', '2');
    expect(trigger).toHaveBeenCalledTimes(2);
    expect(trigger).lastCalledWith(
      expect.objectContaining({
        type: 'mpStorage',
        action: 'set',
      }),
    );
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
  });

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
