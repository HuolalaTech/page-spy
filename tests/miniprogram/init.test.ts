import { isBrowser } from 'src/utils';
import ConsolePlugin from 'miniprogram/plugins/console';
import StoragePlugin from 'miniprogram/plugins/storage';
import NetworkPlugin from 'miniprogram/plugins/network';

import { SpyConsole } from 'types';

describe('Im in the right env', () => {
  it('Im in browser', () => {
    expect(isBrowser()).toBe(false);
  });
});

it('With StoragePlugin loaded, the wx storage apis be wrapped', () => {
  const storageAPIs = [
    'setStorage',
    'setStorageSync',
    'batchSetStorage',
    'batchSetStorageSync',
    'getStorage',
    'getStorageSync',
    'batchGetStorage',
    'batchGetStorageSync',
    'removeStorage',
    'removeStorageSync',
    'clearStorage',
    'clearStorageSync',
  ] as (keyof WXStorageAPI)[];
  const originStorageMethods = storageAPIs.map((i) => wx[i]);
  expect(storageAPIs.map((i) => wx[i])).toEqual(originStorageMethods);

  // changed!
  new StoragePlugin().onCreated();
  expect(storageAPIs.map((i) => wx[i])).not.toEqual(originStorageMethods);
});

it('With ConsolePlugin loaded, ths console.<type> menthods be wrapped', () => {
  const consoleKey: SpyConsole.ProxyType[] = ['log', 'info', 'warn', 'error'];
  const originConsole = consoleKey.map((i) => console[i]);
  expect(consoleKey.map((i) => console[i])).toEqual(originConsole);

  const cPlugin = new ConsolePlugin();
  // @ts-ignore
  expect(Object.keys(cPlugin.console)).toHaveLength(0);

  // changed!
  cPlugin.onCreated();
  expect(consoleKey.map((i) => console[i])).not.toEqual(originConsole);
  // @ts-ignore
  expect(Object.keys(cPlugin.console)).toHaveLength(4);
});

it('With NetworkPlugin loaded, the network request methods be wrapped', () => {
  const originRequest = wx.request;
  // changed!
  new NetworkPlugin().onCreated();
  expect(wx.request).not.toBe(originRequest);
});

export {};
