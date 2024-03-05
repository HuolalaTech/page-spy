import { WS } from 'jest-websocket-mock';
import { WebSocketStore } from 'page-spy-browser/src/helpers/socket';
import type {
  ConnectEvent,
  ErrorEvent,
} from '@huolala-tech/page-spy-types/lib/socket-event';
import * as SERVER_MESSAGE_TYPE from 'base/src/message/server-type';
import { SpyMessage } from '@huolala-tech/page-spy-types';
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
    expect(client.connectionStatus).toBe(true);
    client.getSocket()?.close();

    jest.advanceTimersByTime(2000 + 500);

    expect(reconnect).toHaveBeenCalledTimes(1);
    expect(client.connectionStatus).toBe(true);
  });

  it('Connect failed if reconnect over 3 times', async () => {
    jest.useFakeTimers();
    // @ts-ignore
    expect(client.reconnectTimes).toBe(3);
    server.close();

    jest.advanceTimersByTime((2000 + 500) * 3);
    // @ts-ignore
    expect(client.reconnectTimes).toBe(0);
  });

  it('Stop', async () => {
    expect(client.connectionStatus).toBe(true);
    client.close();

    await sleep();
    expect(client.connectionStatus).toBe(false);
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
    await sleep();
    expect(client.connectionStatus).toBe(false);
  });
});
