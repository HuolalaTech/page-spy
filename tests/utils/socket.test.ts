import { WS } from 'jest-websocket-mock';
import { DEBUG_MESSAGE_TYPE } from 'src/utils/message';
import { SocketStore } from 'src/utils/socket';
import {
  ConnectEvent,
  UnicastEvent,
  ErrorEvent,
  JoinEvent,
} from 'types/lib/socket-event';

// Mock micro task delay
const sleep = (t = 100) => new Promise((r) => setTimeout(r, t));

let server: WS;
let client: SocketStore;
beforeEach(async () => {
  server = new WS(fakeUrl, { jsonProtocol: true });
  client = new SocketStore();
  client.init(fakeUrl);
  await server.connected;
});

afterEach(() => {
  WS.clean();
});

const fakeUrl = 'ws://localhost:1234';

describe('Socket store', () => {
  it('Close, Reconnect', async () => {
    const reconnect = jest.spyOn(client, 'tryReconnect');
    expect(client.connectionStatus).toBe(true);
    client.socket?.close();

    await sleep();
    expect(reconnect).toHaveBeenCalledTimes(1);
    expect(client.connectionStatus).toBe(true);
  });

  it('Connect failed if reconnect over 3 times', async () => {
    expect(client.reconnectTimes).toBe(3);
    server.close();

    await sleep(300);
    expect(client.reconnectTimes).toBe(0);
    expect(client.reconnectable).toBe(false);
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

    // `Connect` type message
    const connectMsg: ConnectEvent = {
      type: 'connect',
      content: {
        roomConnections: [sdkConnection, debugConnection],
        selfConnection: sdkConnection,
      },
    };
    server.send(connectMsg);
    await sleep();
    expect(client.socketConnection).toEqual(connectMsg.content.selfConnection);

    // `Send` type message
    const { DEBUG, ATOM_DETAIL, ATOM_GETTER, DEBUGGER_ONLINE } =
      DEBUG_MESSAGE_TYPE;
    [DEBUG, ATOM_DETAIL, ATOM_GETTER, DEBUGGER_ONLINE]
      .map((type) => ({
        type: 'send',
        content: {
          data: { type, data: '--', role: 'debugger' },
          from: debugConnection,
          to: sdkConnection,
        },
      }))
      .forEach(server.send.bind(server));

    // `Error` type message
    const errMsg: ErrorEvent = {
      type: 'error',
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
