import { isBrowser } from 'base/src';
import SDK from 'mp-base/src/index';

import ConsolePlugin from 'mp-base/src/plugins/console';
import StoragePlugin from 'mp-base/src/plugins/storage';
import NetworkPlugin from 'mp-base/src/plugins/network';

import { SpyConsole } from '@huolala-tech/page-spy-types/index';
import { ROOM_SESSION_KEY } from 'base/src/constants';
import { initStorageMock } from './mock/storage';
import { mp } from './setup';

const sleep = (t = 100) => new Promise((r) => setTimeout(r, t));

beforeEach(() => {
  initStorageMock();
});
afterEach(() => {
  jest.restoreAllMocks();
  SDK.instance = null;
  ConsolePlugin.hasInitd = false;
  NetworkPlugin.hasInitd = false;
  StoragePlugin.hasInitd = false;
});

describe('Im in the right env', () => {
  it('Im in browser', () => {
    expect(isBrowser()).toBe(false);
  });
});

describe('new PageSpy([config])', () => {
  it('Must offer api', () => {
    expect(() => new SDK({ api: '' })).toThrow(
      'The api base url cannot be empty',
    );
  });

  it('Can not init twice', () => {
    new SDK({ api: 'example' });
    const instance = SDK.instance;
    new SDK({ api: 'example' });

    expect(SDK.instance).toEqual(instance);
  });

  it('Load plugins will run `<plugin>.onCreated()`', () => {
    const cPlugin = new ConsolePlugin();
    // const ePlugin = new ErrorPlugin();
    const nPlugin = new NetworkPlugin();
    const s2Plugin = new StoragePlugin();
    const plugins = [cPlugin, nPlugin, s2Plugin];

    const onCreatedFn = jest.fn();
    plugins.forEach((i) => {
      jest.spyOn(i, 'onCreated').mockImplementation(onCreatedFn);
    });

    const sdk = new SDK({ api: 'test-api.com' });
    expect(onCreatedFn).toHaveBeenCalledTimes(0);

    sdk.loadPlugins(cPlugin);
    expect(onCreatedFn).toHaveBeenCalledTimes(1);

    onCreatedFn.mockReset();
    sdk.loadPlugins(...plugins);
    expect(onCreatedFn).toHaveBeenCalledTimes(plugins.length);
  });

  it('With StoragePlugin loaded, the mp storage apis be wrapped', () => {
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
    ] as (keyof MPStorageAPI)[];
    const originStorageMethods = storageAPIs.map((i) => mp[i]);
    expect(storageAPIs.map((i) => mp[i])).toEqual(originStorageMethods);

    // changed!
    new StoragePlugin().onCreated();
    expect(storageAPIs.map((i) => mp[i])).not.toEqual(originStorageMethods);
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
    const originRequest = mp.request;
    // changed!
    const plugin = new NetworkPlugin();
    plugin.onCreated();
    expect(mp.request).not.toBe(originRequest);
    const originProxy = plugin.requestProxy;
    plugin.onCreated();
  });

  it('Plugins can only be inited once', () => {
    const nPlugin = new NetworkPlugin();
    nPlugin.onCreated();
    const cPlugin = new ConsolePlugin();
    cPlugin.onCreated();
    const sPlugin = new StoragePlugin();
    sPlugin.onCreated();
    const originRequestProxy = nPlugin.requestProxy;
    const originConsoleWrap = console.log;
    const originStorageWrap = mp.setStorageSync;
    nPlugin.onCreated();
    cPlugin.onCreated();
    sPlugin.onCreated();

    expect(nPlugin.requestProxy).toEqual(originRequestProxy);
    expect(console.log).toEqual(originConsoleWrap);
    expect(mp.setStorageSync).toEqual(originStorageWrap);
  });

  it('Init connection', async () => {
    expect(mp.getStorageSync(ROOM_SESSION_KEY)).toBeFalsy();

    const sdk = new SDK({ api: 'test-api.com' });
    // await sdk.init();
    await sleep();

    expect(mp.getStorageSync(ROOM_SESSION_KEY)).toEqual({
      name: sdk.name,
      address: sdk.address,
      roomUrl: sdk.roomUrl,
      usable: true,
      project: 'default',
      time: expect.any(Number),
    });
  });

  it('Create room', async () => {});

  it('Init connection with cache', async () => {
    expect(mp.getStorageSync(ROOM_SESSION_KEY)).toBeFalsy();
    mp.setStorageSync(ROOM_SESSION_KEY, {
      name: '',
      address: 'xxxx-address',
      roomUrl: 'test-room-url',
      usable: true,
      project: 'default',
    });

    const spy = jest.spyOn(SDK.prototype, 'useOldConnection');

    new SDK({ api: 'test-api.com' });

    await sleep();
    expect(spy).toBeCalled();
  });
});

export {};
