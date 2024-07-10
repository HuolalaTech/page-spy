import { WS } from 'jest-websocket-mock';
import { WebSocketStore } from 'page-spy-browser/src/helpers/socket';
import type {
  ConnectEvent,
  ErrorEvent,
} from '@huolala-tech/page-spy-types/lib/socket-event';
import * as SERVER_MESSAGE_TYPE from 'page-spy-base/src';
import { SpyMessage } from '@huolala-tech/page-spy-types';
import { SocketState } from 'page-spy-base/src';
// Mock micro task delay
const sleep = (t = 100) => new Promise((r) => setTimeout(r, t));

let server: WS;
let client: WebSocketStore;
beforeEach(async () => {
  server = new WS(fakeUrl, { jsonProtocol: true });
  client = new WebSocketStore();
  client.init(fakeUrl);
  await server.connected;
});

afterEach(() => {
  WS.clean();
  jest.useRealTimers();
});

const fakeUrl = 'ws://localhost:1234';

describe('Socket store', () => {
  it('Close, Reconnect', async () => {
    jest.useFakeTimers();
    // @ts-ignore
    const reconnect = jest.spyOn(client, 'tryReconnect');
    expect(client.getSocket().getState()).toBe(SocketState.OPEN);
    client.getSocket()?.close();

    jest.advanceTimersByTime(2000 + 500);

    expect(reconnect).toHaveBeenCalledTimes(1);
    expect(client.getSocket().getState()).toBe(SocketState.OPEN);
  });

  it('Reconnect time will increase exponentially, and will be fixed to 4 times increased.', async () => {
    jest.useFakeTimers();
    const reconnect = jest.spyOn(client, 'tryReconnect');
    // @ts-ignore
    server.close();
    jest.advanceTimersByTime(2000 + 100);
    expect(reconnect).toHaveBeenCalledTimes(1);

    jest.advanceTimersByTime(2000 * 1.5);
    expect(reconnect).toHaveBeenCalledTimes(2);

    jest.advanceTimersByTime(2000 * 2.25);
    expect(reconnect).toHaveBeenCalledTimes(3);

    jest.advanceTimersByTime(2000 * 3.375);
    expect(reconnect).toHaveBeenCalledTimes(4);

    jest.advanceTimersByTime(2000 * 5.0625 * 2);
    expect(reconnect).toHaveBeenCalledTimes(6);
  });

  it('Stop', async () => {
    expect(client.getSocket().getState()).toBe(SocketState.OPEN);
    client.close();

    await sleep();
    expect(client.getSocket().getState()).not.toBe(SocketState.OPEN);
  });

  it('Message type', async () => {
    const sdkConnection = {
      name: 'SDK',
      userId: 'SDK',
      address: '<hash>',
    };
    const debugConnection = {
      name: 'Debugger',
      userId: 'Debugger',
      address: '<hash>',
    };

    const { CONNECT, ERROR, MESSAGE } = SERVER_MESSAGE_TYPE;

    // `Connect` type message
    const connectMsg: ConnectEvent = {
      type: CONNECT,
      content: {
        roomConnections: [sdkConnection, debugConnection],
        selfConnection: sdkConnection,
      },
    };
    server.send(connectMsg);
    await sleep();
    // @ts-ignore
    expect(client.socketConnection).toEqual(connectMsg.content.selfConnection);

    // `Send` type message
    const debugMsgTypes: SpyMessage.MessageType[] = [
      'debug',
      'atom-detail',
      'atom-getter',
      'debugger-online',
    ];

    debugMsgTypes
      .map((type) => ({
        type: MESSAGE,
        content: {
          data: { type, data: '--', role: 'debugger' },
          from: debugConnection,
          to: sdkConnection,
        },
      }))
      .forEach(server.send.bind(server));

    // `Error` type message
    const errMsg: ErrorEvent = {
      type: ERROR,
      content: {
        code: '',
        message: 'boom',
      },
    };
    server.send(errMsg);
    // sleep time here be 2000 is for SDK will auto reconnect after 2000ms
    await sleep(2000);
    expect(client.getSocket().getState()).not.toBe(SocketState.OPEN);
  });
});
