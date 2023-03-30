import SDK from 'src/index';
import ConsolePlugin from 'src/plugins/console';
import ErrorPlugin from 'src/plugins/error';
import NetworkPlugin from 'src/plugins/network';
import SystemPlugin from 'src/plugins/system';
import PagePlugin from 'src/plugins/page';
import { StoragePlugin } from 'src/plugins/storage';
import { SpyConsole } from 'types';
import socketStore from 'src/utils/socket';
import { ROOM_SESSION_KEY } from 'src/utils/constants';

const rootId = '#__pageSpy';
afterEach(() => {
  jest.restoreAllMocks();
  document.querySelector(rootId)?.remove();
  sessionStorage.removeItem(ROOM_SESSION_KEY);
});

describe('new PageSpy([config])', () => {
  it('Auto detect config by parsing `document.currentScript.src`', () => {
    const sdk = new SDK();

    // The config value inited from /tests/setup.ts
    expect(sdk.config).toEqual(
      expect.objectContaining({
        api: 'example.com',
        clientOrigin: 'https://example.com',
      }),
    );
  });

  it('Pass config to constructor manually', () => {
    const config = {
      api: 'custom-server.com',
      clientOrigin: 'https://debug-ui.com',
    };

    const sdk = new SDK(config);
    expect(sdk.config).toEqual(expect.objectContaining(config));
  });

  it('Cannot init duplicate', () => {
    const errorFn = jest.fn();
    console.error = errorFn;

    new SDK().render();
    new SDK().render();

    expect(errorFn).toBeCalledTimes(1);
  });

  it('Load plugins will run `<plugin>.onCreated()`', () => {
    const cPlugin = new ConsolePlugin();
    const ePlugin = new ErrorPlugin();
    const nPlugin = new NetworkPlugin();
    const s1Plugin = new SystemPlugin();
    const pPlugin = new PagePlugin();
    const s2Plugin = new StoragePlugin();
    const plugins = [cPlugin, ePlugin, nPlugin, s1Plugin, pPlugin, s2Plugin];

    const onCreatedFn = jest.fn();
    plugins.forEach((i) => {
      jest.spyOn(i, 'onCreated').mockImplementation(onCreatedFn);
    });

    const sdk = new SDK();
    expect(onCreatedFn).toHaveBeenCalledTimes(0);

    sdk.loadPlugins(cPlugin);
    expect(onCreatedFn).toHaveBeenCalledTimes(1);

    onCreatedFn.mockReset();
    sdk.loadPlugins(...plugins);
    expect(onCreatedFn).toHaveBeenCalledTimes(plugins.length);
  });

  it('With ConsolePlugin loaded, ths console.<type> menthods be wrapped', () => {
    const consoleKey: SpyConsole.ProxyType[] = ['log', 'info', 'warn', 'error'];
    const originConsole = consoleKey.map((i) => console[i]);
    expect(consoleKey.map((i) => console[i])).toEqual(originConsole);

    const cPlugin = new ConsolePlugin();
    expect(Object.keys(cPlugin.console)).toHaveLength(0);

    // changed!
    cPlugin.onCreated();
    expect(consoleKey.map((i) => console[i])).not.toEqual(originConsole);
    expect(Object.keys(cPlugin.console)).toHaveLength(4);
  });

  it('With StoragePlugin loaded, the Storage.prototype[.<method>] be wrapped', () => {
    const protoKey = ['clear', 'setItem', 'removeItem'];
    const originProtoMethods = protoKey.map((i) => Storage.prototype[i]);
    expect(protoKey.map((i) => Storage.prototype[i])).toEqual(
      originProtoMethods,
    );

    // changed!
    new StoragePlugin().onCreated();
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
    new NetworkPlugin().onCreated();
    expect(
      xhrProtoKey.map((i) => window.XMLHttpRequest.prototype[i]),
    ).not.toEqual(originXhrProtoMethods);
    expect(window.fetch).not.toBe(originFetch);
    expect(window.navigator.sendBeacon).not.toBe(originBeacon);
  });

  it('Content load and unload', async () => {
    const sdk = new SDK();

    const close = jest.spyOn(socketStore, 'close');
    const init = jest.spyOn(sdk, 'initConnection');

    window.dispatchEvent(new Event('DOMContentLoaded'));
    expect(init).toHaveBeenCalled();

    window.dispatchEvent(new Event('beforeunload'));
    expect(close).toHaveBeenCalled();
  });
  it('Init connection', async () => {
    const sdk = new SDK();
    const response = {
      code: 'ok',
      message: 'mock response',
      success: true,
      data: {
        name: 'xxxx-name',
        address: 'xxxx-address',
        group: 'xxxx-group',
        password: 'xxxx-password',
        tags: {},
      },
    };
    jest.spyOn(sdk.request, 'createRoom').mockImplementation(async function () {
      return response;
    });

    expect(sessionStorage.getItem(ROOM_SESSION_KEY)).toBe(null);

    await sdk.initConnection();
    expect(JSON.parse(sessionStorage.getItem(ROOM_SESSION_KEY)!)).toEqual({
      name: sdk.name,
      address: sdk.address,
      roomUrl: sdk.roomUrl,
      usable: true,
      project: 'default',
    });
  });

  it('Init connection with cache', () => {
    expect(sessionStorage.getItem(ROOM_SESSION_KEY)).toBe(null);
    sessionStorage.setItem(
      ROOM_SESSION_KEY,
      JSON.stringify({
        name: '',
        address: '',
        roomUrl: '',
        usable: true,
        project: 'default',
      }),
    );

    const spy = jest.spyOn(SDK.prototype, 'useOldConnection');

    new SDK();
    window.dispatchEvent(new Event('DOMContentLoaded'));
    expect(spy).toBeCalled();
  });

  it('Create new connection if cache is invalid', () => {
    expect(sessionStorage.getItem(ROOM_SESSION_KEY)).toBe(null);
    sessionStorage.setItem(
      ROOM_SESSION_KEY,
      JSON.stringify({
        name: '',
        address: '',
        roomUrl: '',
        usable: false,
        project: 'default',
      }),
    );

    const spy = jest.spyOn(SDK.prototype, 'createNewConnection');

    new SDK();
    window.dispatchEvent(new Event('DOMContentLoaded'));
    expect(spy).toBeCalled();
  });
});
