import SDK from 'page-spy-browser/src/index';
import ConsolePlugin from 'page-spy-browser/src/plugins/console';
import ErrorPlugin from 'page-spy-browser/src/plugins/error';
import NetworkPlugin from 'page-spy-browser/src/plugins/network';
import SystemPlugin from 'page-spy-browser/src/plugins/system';
import PagePlugin from 'page-spy-browser/src/plugins/page';
import { StoragePlugin } from 'page-spy-browser/src/plugins/storage';
import { OnInitParams, SpyConsole } from '@huolala-tech/page-spy-types';
import socketStore from 'page-spy-browser/src/helpers/socket';
import { atom, ROOM_SESSION_KEY } from 'page-spy-base/src';
import { isBrowser } from 'page-spy-base/src';
import Request from 'page-spy-browser/src/api';
import { DatabasePlugin } from 'page-spy-browser/src/plugins/database';
import { Config, InitConfig } from 'page-spy-browser/src/config';
import socket from 'page-spy-browser/src/helpers/socket';

const initParams = {
  config: new Config().mergeConfig({}),
  socketStore: socket,
  atom,
} as OnInitParams<InitConfig>;
const sleep = (t = 100) => new Promise((r) => setTimeout(r, t));

let sdk: SDK | null;

const rootId = '#__pageSpy';
afterEach(() => {
  jest.restoreAllMocks();
  jest.useRealTimers();
  document.querySelector(rootId)?.remove();
  sessionStorage.removeItem(ROOM_SESSION_KEY);
  sdk?.abort();
  sdk = null;
  SDK.instance = null;
});

describe('Im in the right env', () => {
  it('Im in browser', () => {
    expect(isBrowser()).toBe(true);
  });
});

describe('new PageSpy([config])', () => {
  it('Auto detect config by parsing `document.currentScript.src`', () => {
    sdk = new SDK();

    // The config value inited from /tests/setup.ts
    const config = sdk.config.get();
    expect(config).toEqual(
      expect.objectContaining({
        api: 'example.com',
        clientOrigin: 'https://example.com',
      }),
    );
  });

  it('Pass config to constructor manually', () => {
    const userCfg = {
      api: 'custom-server.com',
      clientOrigin: 'https://debug-ui.com',
      enableSSL: true,
    };

    sdk = new SDK(userCfg);
    const config = sdk.config.get();
    expect(config).toEqual(expect.objectContaining(userCfg));
  });

  it('Load plugins will run `<plugin>.onInit()`', () => {
    const INTERNAL_PLUGINS = [
      ConsolePlugin,
      ErrorPlugin,
      NetworkPlugin,
      StoragePlugin,
      DatabasePlugin,
      PagePlugin,
      SystemPlugin,
    ];

    expect(INTERNAL_PLUGINS.every((i) => i.hasInitd === false)).toBe(true);

    const onInitFn = jest.fn();
    INTERNAL_PLUGINS.forEach((i) => {
      jest.spyOn(i.prototype, 'onInit').mockImplementation(onInitFn);
    });

    sdk = new SDK();
    expect(onInitFn).toHaveBeenCalledTimes(INTERNAL_PLUGINS.length);
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
    cPlugin.onInit(initParams);
    expect(consoleKey.map((i) => console[i])).not.toEqual(originConsole);
    // @ts-ignore
    expect(Object.keys(cPlugin.console)).toHaveLength(consoleKey.length);
  });

  it('With StoragePlugin loaded, the Storage.prototype[.<method>] be wrapped', () => {
    const protoKey = ['clear', 'setItem', 'removeItem'];
    const originProtoMethods = protoKey.map((i) => Storage.prototype[i]);
    expect(protoKey.map((i) => Storage.prototype[i])).toEqual(
      originProtoMethods,
    );

    // changed!
    new StoragePlugin().onInit(initParams);
    expect(protoKey.map((i) => Storage.prototype[i])).not.toEqual(
      originProtoMethods,
    );
  });

  it('With NetworkPlugin loaded, the network request methods be wrapped', () => {
    // xhr
    const xhrProtoKey = ['open', 'setRequestHeader', 'send'] as const;
    const originXhrProtoMethods = xhrProtoKey.map(
      (i) => window.XMLHttpRequest.prototype[i],
    );
    expect(xhrProtoKey.map((i) => window.XMLHttpRequest.prototype[i])).toEqual(
      originXhrProtoMethods,
    );
    // fetch
    const originFetch = window.fetch;
    // sendBeacon
    const originBeacon = window.navigator.sendBeacon;

    // changed!
    new NetworkPlugin().onInit(initParams);
    expect(
      xhrProtoKey.map((i) => window.XMLHttpRequest.prototype[i]),
    ).not.toEqual(originXhrProtoMethods);
    expect(window.fetch).not.toBe(originFetch);
    expect(window.navigator.sendBeacon).not.toBe(originBeacon);
  });

  it('Content load', async () => {
    const init = jest.spyOn(SDK.prototype as any, 'init');

    new SDK();

    window.dispatchEvent(new Event('DOMContentLoaded'));
    expect(init).toHaveBeenCalled();
  });

  it('Init connection', async () => {
    const response = {
      name: 'xxxx-name',
      address: 'xxxx-address',
      roomUrl: 'wss://xxxx-url',
      secret: '',
      useSecret: false,
    };
    jest
      .spyOn(Request.prototype, 'createRoom')
      .mockImplementation(async function () {
        return response;
      });

    expect(sessionStorage.getItem(ROOM_SESSION_KEY)).toBe(null);

    const sdk = new SDK();
    await sleep();

    expect(JSON.parse(sessionStorage.getItem(ROOM_SESSION_KEY)!)).toEqual({
      address: sdk.address,
      project: 'default',
      title: '--',
      secret: '',
      useSecret: false,
    });
  });

  it('Init connection with cache', () => {
    expect(sessionStorage.getItem(ROOM_SESSION_KEY)).toBe(null);
    sessionStorage.setItem(
      ROOM_SESSION_KEY,
      JSON.stringify({
        address: 'xxx',
        project: 'default',
        title: '--',
        secret: '',
        useSecret: false,
      }),
    );

    const spy = jest.spyOn(SDK.prototype as any, 'useOldConnection');

    new SDK();
    window.dispatchEvent(new Event('DOMContentLoaded'));
    expect(spy).toBeCalled();
  });

  it('Will get the same instance with duplicate init', () => {
    expect(SDK.instance).toBe(null);

    // 1st init
    const ins1 = new SDK();
    // 2nd init
    const ins2 = new SDK();

    expect(ins1).toBe(ins2);
  });

  // it('PageSpy.prototype.refreshRoomInfo', () => {
  //   jest.useFakeTimers();

  //   SDK.prototype.refreshRoomInfo();
  //   jest.advanceTimersByTime(30 * 1000);
  // });
});
