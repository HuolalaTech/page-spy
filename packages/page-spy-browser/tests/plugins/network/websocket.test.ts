import { Config, InitConfig } from 'page-spy-browser/src/config';
import { atom, ReqReadyState } from 'page-spy-base/src';
import socket from 'page-spy-browser/src/helpers/socket';
import { OnInitParams } from 'packages/page-spy-types';

const initParams = {
  config: new Config().mergeConfig({}),
  socketStore: socket,
  atom,
} as OnInitParams<InitConfig>;

class MockWebSocket extends EventTarget {
  public static instances: MockWebSocket[] = [];

  public sent: unknown[] = [];

  constructor(
    public url: string | URL,
    public protocols?: string | string[],
  ) {
    super();
    MockWebSocket.instances.push(this);
  }

  public send(data: unknown) {
    this.sent.push(data);
  }
}

const originWebSocket = window.WebSocket;

describe('WebSocketPlugin', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    MockWebSocket.instances = [];
    Object.defineProperty(window, 'WebSocket', {
      configurable: true,
      value: MockWebSocket,
      writable: true,
    });
    jest.resetModules();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
    Object.defineProperty(window, 'WebSocket', {
      configurable: true,
      value: originWebSocket,
      writable: true,
    });
  });

  it('records a connection and sent message', () => {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const WebSocketPlugin =
      require('page-spy-browser/src/plugins/network/websocket').default;
    const plugin = new WebSocketPlugin();
    plugin.onInit(initParams);

    const connection = new window.WebSocket('wss://example.test', 'chat');
    connection.dispatchEvent(new Event('open'));
    connection.send('hello');

    const request = Object.values(plugin.getRequestMap())[0];
    expect(request).toEqual(
      expect.objectContaining({
        method: 'GET',
        readyState: ReqReadyState.DONE,
        requestType: 'websocket',
        response: expect.objectContaining({ data: 'hello', type: 'send' }),
        status: 200,
      }),
    );
    expect(MockWebSocket.instances[0]?.sent).toEqual(['hello']);

    plugin.onReset();
    expect(window.WebSocket).toBe(MockWebSocket);
    expect(WebSocketPlugin.hasInitd).toBe(false);

    const nextPlugin = new WebSocketPlugin();
    nextPlugin.onInit(initParams);
    expect(window.WebSocket).not.toBe(MockWebSocket);
  });
});
