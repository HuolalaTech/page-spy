import SDK from 'page-spy-react-native/src';
import ConsolePlugin from 'page-spy-react-native/src/plugins/console';
import NetworkPlugin from 'page-spy-react-native/src/plugins/network';
import ErrorPlugin from 'page-spy-react-native/src/plugins/error';
import SystemPlugin from 'page-spy-react-native/src/plugins/system';

import { SpyConsole } from '@huolala-tech/page-spy-types/index';
import { SocketState } from 'base/src/socket-base';

const sleep = (t = 100) => new Promise((r) => setTimeout(r, t));
let sdk: SDK | null;

beforeEach(() => {});
afterEach(() => {
  jest.restoreAllMocks();
  SDK.instance?.abort();
  SDK.instance = null;
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
    // xhr
    const xhrProtoKey = ['open', 'setRequestHeader', 'send'] as const;
    const originXhrProtoMethods = xhrProtoKey.map(
      (i) => window.XMLHttpRequest.prototype[i],
    );
    expect(xhrProtoKey.map((i) => window.XMLHttpRequest.prototype[i])).toEqual(
      originXhrProtoMethods,
    );

    // changed!
    new NetworkPlugin().onInit();
    expect(
      xhrProtoKey.map((i) => window.XMLHttpRequest.prototype[i]),
    ).not.toEqual(originXhrProtoMethods);
  });

  it('Plugins can only be inited once', () => {
    const nPlugin = new NetworkPlugin();
    nPlugin.onInit();
    const cPlugin = new ConsolePlugin();
    cPlugin.onInit();
    const originXhrProxy = nPlugin.xhrProxy;
    const originConsoleWrap = console.log;
    nPlugin.onInit();
    cPlugin.onInit();

    expect(nPlugin.xhrProxy).toEqual(originXhrProxy);
    expect(console.log).toEqual(originConsoleWrap);
    cPlugin.onReset();
    nPlugin.onReset();
  });

  it('Init connection', async () => {
    const sdk = new SDK({ api: 'test-api.com' });
    await sleep();

    expect(sdk.socketStore.getSocket().getState()).toEqual(SocketState.OPEN);
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
