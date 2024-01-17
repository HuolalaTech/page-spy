import { isBrowser } from 'base/src';
import SDK from 'mp-base/src/index';

import ConsolePlugin from 'mp-base/src/plugins/console';
import StoragePlugin from 'mp-base/src/plugins/storage';
import NetworkPlugin from 'mp-base/src/plugins/network';
import ErrorPlugin from 'mp-base/src/plugins/error';
import SystemPlugin from 'mp-base/src/plugins/system';

import { SpyConsole } from '@huolala-tech/page-spy-types/index';
import { ROOM_SESSION_KEY } from 'base/src/constants';
import { initStorageMock } from './mock/storage';
import { mp } from './setup';

const sleep = (t = 100) => new Promise((r) => setTimeout(r, t));
let sdk: SDK | null;

beforeEach(() => {
  initStorageMock();
});
afterEach(() => {
  jest.restoreAllMocks();
  SDK.instance?.abort();
  SDK.instance = null;
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

  it('Load plugins will run `<plugin>.onInit()`', () => {
    const INTERNAL_PLUGINS = [
      ConsolePlugin,
      ErrorPlugin,
      NetworkPlugin,
      StoragePlugin,
      SystemPlugin,
    ];

    expect(INTERNAL_PLUGINS.every((i) => i.hasInitd === false)).toBe(true);

    const onInitFn = jest.fn();
    INTERNAL_PLUGINS.forEach((i) => {
      jest.spyOn(i.prototype, 'onInit').mockImplementation(onInitFn);
    });

    sdk = new SDK({ api: 'test-api.com' });
    expect(onInitFn).toHaveBeenCalledTimes(INTERNAL_PLUGINS.length);
  });

  it('With StoragePlugin loaded, the mp storage apis be wrapped', () => {
    const storageAPIs = [
      'setStorage',
      'setStorageSync',
      'batchSetStorage',
      'batchSetStorageSync',
      'batchGetStorage',
      'removeStorage',
      'removeStorageSync',
      'clearStorage',
      'clearStorageSync',
    ] as (keyof MPStorageAPI)[];
    const originStorageMethods = storageAPIs.map((i) => mp[i]);
    expect(storageAPIs.map((i) => mp[i])).toEqual(originStorageMethods);

    // changed!
    const plugin = new StoragePlugin();
    plugin.onInit();
    expect(storageAPIs.map((i) => mp[i])).not.toEqual(originStorageMethods);

    // reset
    plugin.onReset();
    expect(storageAPIs.map((i) => mp[i])).toEqual(originStorageMethods);
  });

  it('With ConsolePlugin loaded, ths console.<type> menthods be wrapped', () => {
    const consoleKey: SpyConsole.ProxyType[] = [
      'log',
      'info',
      'warn',
      'error',
      'debug',
    ];
    const originConsole = consoleKey.map((i) => console[i]);
    expect(consoleKey.map((i) => console[i])).toEqual(originConsole);

    const cPlugin = new ConsolePlugin();
    // @ts-ignore
    expect(Object.keys(cPlugin.console)).toHaveLength(0);

    // changed!
    cPlugin.onInit();
    expect(consoleKey.map((i) => console[i])).not.toEqual(originConsole);
    // @ts-ignore
    expect(Object.keys(cPlugin.console)).toHaveLength(5);

    // reset
    cPlugin.onReset();
    expect(consoleKey.map((i) => console[i])).toEqual(originConsole);
  });

  it('With NetworkPlugin loaded, the network request methods be wrapped', () => {
    const originRequest = mp.request;
    const plugin = new NetworkPlugin();
    // origin
    expect(mp.request).toBe(originRequest);
    // changed!
    plugin.onInit();
    expect(mp.request).not.toBe(originRequest);
    // reset
    plugin.onReset();
    expect(mp.request).toBe(originRequest);
  });

  it('Plugins can only be inited once', () => {
    const nPlugin = new NetworkPlugin();
    nPlugin.onInit();
    const cPlugin = new ConsolePlugin();
    cPlugin.onInit();
    const sPlugin = new StoragePlugin();
    sPlugin.onInit();
    const originRequestProxy = nPlugin.requestProxy;
    const originConsoleWrap = console.log;
    const originStorageWrap = mp.setStorageSync;
    nPlugin.onInit();
    cPlugin.onInit();
    sPlugin.onInit();

    expect(nPlugin.requestProxy).toEqual(originRequestProxy);
    expect(console.log).toEqual(originConsoleWrap);
    expect(mp.setStorageSync).toEqual(originStorageWrap);
    cPlugin.onReset();
    sPlugin.onReset();
    nPlugin.onReset();
  });

  it('Init connection', async () => {
    expect(mp.getStorageSync(ROOM_SESSION_KEY)).toBeFalsy();

    const sdk = new SDK({ api: 'test-api.com' });
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

  it('Will get the same instance with duplicate init', () => {
    expect(SDK.instance).toBe(null);

    // 1st init
    const ins1 = new SDK({ api: 'sss' });
    // 2nd init
    const ins2 = new SDK({ api: 'bbb' });

    expect(ins1).toBe(ins2);
  });
});

export {};
