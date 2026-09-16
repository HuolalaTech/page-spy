import {
  Client,
  InitConfigBase,
  psLog,
  SocketState,
  SocketStoreBase,
  SocketWrapper,
} from 'page-spy-base/src';
import type { SpySocket } from '@huolala-tech/page-spy-types';

class TestSocketWrapper extends SocketWrapper {
  public state = SocketState.CLOSED;

  public sent: string[] = [];

  public sendFailure: unknown = null;

  init(): void {
    this.state = SocketState.OPEN;
  }

  send(data: string): void {
    if (this.sendFailure !== null) {
      throw this.sendFailure;
    }
    this.sent.push(data);
  }

  close(): void {
    this.state = SocketState.CLOSED;
  }

  getState(): SocketState {
    return this.state;
  }

  emitOpen() {
    this.emit('open', {});
  }

  emitClose() {
    this.emit('close', { code: 1000, reason: 'closed' });
  }

  emitMessage(data: unknown) {
    this.emit('message', { data });
  }
}

class TestSocketStore extends SocketStoreBase {
  protected socketWrapper = new TestSocketWrapper();

  onOffline(): void {}

  setSocketState(state: SocketState) {
    this.socketWrapper.state = state;
  }

  emitOpen() {
    this.socketWrapper.emitOpen();
  }

  emitClose() {
    this.socketWrapper.emitClose();
  }

  getSentPayloads() {
    return this.socketWrapper.sent;
  }

  setSendFailure(failure: unknown) {
    this.socketWrapper.sendFailure = failure;
  }

  processMessage(data: string) {
    this.handleMessage({ data });
  }

  processEvent(data: unknown) {
    this.handleMessage({ data });
  }
}

class CapturingSocketStore extends TestSocketStore {
  public sent: Array<{ message: SpySocket.ClientEvent; noCache: boolean }> = [];

  protected send(message: SpySocket.ClientEvent, noCache = false) {
    this.sent.push({ message, noCache });
  }
}

describe('SocketWrapper', () => {
  it('notifies listeners and clears them after close', () => {
    const wrapper = new TestSocketWrapper();
    const onOpen = jest.fn();
    const onClose = jest.fn();
    const onMessage = jest.fn();
    wrapper.onOpen(onOpen);
    wrapper.onClose(onClose);
    wrapper.onMessage(onMessage);

    wrapper.emitOpen();
    wrapper.emitMessage('payload');
    wrapper.emitClose();
    wrapper.emitOpen();

    expect(onOpen).toHaveBeenCalledTimes(1);
    expect(onMessage).toHaveBeenCalledWith({ data: 'payload' });
    expect(onClose).toHaveBeenCalledWith({ code: 1000, reason: 'closed' });
  });
});

describe('SocketStoreBase', () => {
  it('dispatches interactive events to registered listeners', () => {
    const store = new TestSocketStore();
    const listener = jest.fn();
    const from = { address: 'debugger', name: 'Debugger', userId: 'debugger' };
    const to = { address: 'client', name: 'Client', userId: 'client' };
    store.addListener('debug', listener);

    store.dispatchEvent('debug', {
      source: { role: 'debugger', type: 'debug', data: { enabled: true } },
      from,
      to,
    });

    expect(listener).toHaveBeenCalledWith(
      expect.objectContaining({ from, to }),
      expect.any(Function),
    );
    store.close();
  });

  it('removes interactive listeners and dispatches public data listeners', () => {
    const store = new TestSocketStore();
    const interactiveListener = jest.fn();
    const publicDataListener = jest.fn();
    store.addListener('debug', interactiveListener);
    store.removeListener('debug', interactiveListener);
    store.addListener('public-data', publicDataListener);
    const message = {
      role: 'client' as const,
      type: 'console' as const,
      data: {},
    };

    store.dispatchEvent('public-data', message);

    expect(store.events.debug).toEqual([]);
    expect(publicDataListener).toHaveBeenCalledWith(message);
  });

  it('sends room information from configuration and client metadata', () => {
    const store = new CapturingSocketStore();
    const config: Required<InitConfigBase> = {
      api: '',
      project: 'project',
      title: 'title',
      enableSSL: true,
      messageCapacity: 1000,
      useSecret: false,
      secret: '',
      offline: false,
      serializeData: false,
      disabledPlugins: [],
      dataProcessor: {},
    };
    store.getPageSpyConfig = () => config;
    store.getClient = () => new Client({ ua: 'Client UA' });

    store.updateRoomInfo();

    expect(store.sent).toEqual([
      {
        noCache: true,
        message: expect.objectContaining({
          type: 'updateRoomInfo',
          content: {
            info: {
              name: 'Client UA',
              group: 'project',
              tags: { title: 'title', name: 'Client UA', group: 'project' },
            },
          },
        }),
      },
    ]);
  });

  it('broadcasts client information when a debugger connects', () => {
    const store = new CapturingSocketStore();
    store.getClient = () => new Client({ ua: 'Client UA', sdk: 'browser' });

    store.sendClientInfo();

    expect(store.sent).toEqual([
      {
        noCache: true,
        message: expect.objectContaining({
          type: 'broadcast',
          content: {
            data: expect.objectContaining({
              type: 'client-info',
              data: expect.objectContaining({
                sdk: 'browser',
                ua: 'Client UA',
              }),
            }),
          },
        }),
      },
    ]);
  });

  it('routes valid incoming interactive messages to listeners', () => {
    const store = new TestSocketStore();
    const listener = jest.fn();
    const from = { address: 'debugger', name: 'Debugger', userId: 'debugger' };
    const to = { address: 'client', name: 'Client', userId: 'client' };
    store.socketConnection = to;
    store.addListener('debug', listener);

    store.processMessage(
      JSON.stringify({
        type: 'message',
        content: {
          data: { role: 'debugger', type: 'debug', data: { enabled: true } },
          from,
          to,
        },
      }),
    );

    expect(listener).toHaveBeenCalledWith(
      expect.objectContaining({ from, to }),
      expect.any(Function),
    );
    store.close();
  });

  it('routes messages unwrapped by platform filters', () => {
    const store = new TestSocketStore();
    const listener = jest.fn();
    const from = { address: 'debugger', name: 'Debugger', userId: 'debugger' };
    const to = { address: 'client', name: 'Client', userId: 'client' };
    store.socketConnection = to;
    store.addListener('debug', listener);
    SocketStoreBase.messageFilters.push((event) => event.data);

    store.processEvent({
      data: JSON.stringify({
        type: 'message',
        content: {
          data: { role: 'debugger', type: 'debug', data: {} },
          from,
          to,
        },
      }),
    });

    expect(listener).toHaveBeenCalled();
    SocketStoreBase.messageFilters = [];
    store.close();
  });

  it('records SDK and debugger connections from a connect event', () => {
    const store = new TestSocketStore();
    const sdk = { address: 'client', name: 'Client', userId: 'client' };
    const debuggerConnection = {
      address: 'debugger',
      name: 'Debugger',
      userId: 'Debugger',
    };

    store.processMessage(
      JSON.stringify({
        type: 'connect',
        content: {
          selfConnection: sdk,
          roomConnections: [sdk, debuggerConnection],
        },
      }),
    );

    expect(store.socketConnection).toEqual(sdk);
    expect(store.debuggerConnection).toEqual(debuggerConnection);
    store.close();
  });

  it('broadcasts client information when a debugger joins', () => {
    const store = new CapturingSocketStore();
    const debuggerConnection = {
      address: 'debugger',
      name: 'Debugger',
      userId: 'Debugger',
    };
    store.getClient = () => new Client({ ua: 'Client UA', sdk: 'browser' });

    store.processMessage(
      JSON.stringify({
        type: 'join',
        content: { connection: debuggerConnection },
      }),
    );

    expect(store.debuggerConnection).toEqual(debuggerConnection);
    expect(store.sent[0].message).toMatchObject({ type: 'broadcast' });
    store.close();
  });

  it('handles invalid incoming messages and removes a departed debugger', () => {
    const store = new TestSocketStore();
    const warn = jest.spyOn(psLog, 'warn').mockImplementation();
    const debuggerConnection = {
      address: 'debugger',
      name: 'Debugger',
      userId: 'Debugger',
    };
    store.debuggerConnection = debuggerConnection;

    store.processEvent(null);
    store.processMessage('{');
    store.processMessage(
      JSON.stringify({
        type: 'leave',
        content: { connection: debuggerConnection },
      }),
    );

    expect(warn).toHaveBeenCalledWith(
      'Failed to parse message, expected string data.',
    );
    expect(warn).toHaveBeenCalledWith(
      'Failed to parse message, malformed data received.',
    );
    expect(store.debuggerConnection).toBeNull();

    warn.mockRestore();
    store.close();
  });

  it('reports an empty socket URL without initializing a connection', async () => {
    const store = new TestSocketStore();
    const error = jest.spyOn(psLog, 'error').mockImplementation();

    await store.init('');

    expect(error).toHaveBeenCalledWith('WebSocket url cannot be empty');
    expect(store.socketUrl).toBe('');

    error.mockRestore();
  });

  it('keeps only the latest buffered broadcast messages at capacity', () => {
    const store = new TestSocketStore();
    store.messageCapacity = 2;

    ['first', 'second', 'third'].forEach((data) => {
      store.broadcastMessage({ role: 'client', type: 'console', data });
    });

    expect(store.messages).toHaveLength(3);
    expect(
      store.messages.slice(1).map((message) => message.content.data.data),
    ).toEqual(['second', 'third']);
  });

  it('replays buffered messages newer than the debugger latest id', () => {
    const store = new TestSocketStore();
    const client = { address: 'client', name: 'Client', userId: 'client' };
    const debuggerConnection = {
      address: 'debugger',
      name: 'Debugger',
      userId: 'Debugger',
    };
    store.socketConnection = client;
    store.broadcastMessage({
      role: 'client',
      type: 'console',
      data: { id: 'first' },
    });
    store.broadcastMessage({
      role: 'client',
      type: 'console',
      data: { id: 'second' },
    });
    store.setSocketState(SocketState.OPEN);
    store.debuggerConnection = debuggerConnection;

    store.handleFlushBuffer({
      source: {
        role: 'debugger',
        type: 'debugger-online',
        data: { latestId: 'first' },
      },
      from: debuggerConnection,
      to: client,
    });

    expect(JSON.parse(store.getSentPayloads()[0])).toMatchObject({
      type: 'message',
      content: {
        data: { type: 'console', data: { id: 'second' } },
        from: client,
        to: debuggerConnection,
      },
    });
  });

  it('sends only when the socket is open and a debugger is connected', () => {
    const store = new TestSocketStore();
    const message = {
      type: 'broadcast' as const,
      content: {
        data: { role: 'client' as const, type: 'console' as const, data: {} },
      },
    };

    expect(store.checkIfSend(message)).toBe(false);
    store.setSocketState(SocketState.OPEN);
    expect(store.checkIfSend(message)).toBe(false);
    store.debuggerConnection = {
      address: 'debugger',
      name: 'Debugger',
      userId: 'debugger',
    };
    expect(store.checkIfSend(message)).toBe(true);
  });

  it('does not cache direct messages, pings, or offline messages', () => {
    const store = new TestSocketStore();

    expect(store.checkIfCache({ type: 'ping', content: null })).toBe(false);
    expect(
      store.checkIfCache({
        type: 'message',
        content: {
          data: { role: 'client', type: 'debug', data: {} },
          from: { address: 'a', name: 'a', userId: 'a' },
          to: { address: 'b', name: 'b', userId: 'b' },
        },
      }),
    ).toBe(false);
    store.isOffline = true;
    expect(
      store.checkIfCache({
        type: 'broadcast',
        content: { data: { role: 'client', type: 'console', data: {} } },
      }),
    ).toBe(false);
  });

  it('serializes unicast messages with transport metadata', () => {
    const store = new TestSocketStore();
    const client = { address: 'client', name: 'Client', userId: 'client' };
    const debuggerConnection = {
      address: 'debugger',
      name: 'Debugger',
      userId: 'Debugger',
    };
    store.setSocketState(SocketState.OPEN);
    store.socketConnection = client;
    store.debuggerConnection = debuggerConnection;

    store.unicastMessage(
      { role: 'client', type: 'debug', data: { enabled: true } },
      debuggerConnection,
    );

    expect(JSON.parse(store.getSentPayloads()[0])).toMatchObject({
      type: 'message',
      content: {
        data: { role: 'client', type: 'debug', data: { enabled: true } },
        from: client,
        to: debuggerConnection,
      },
      createdAt: expect.any(Number),
      requestId: expect.any(String),
    });
    expect(store.messages).toEqual([]);
  });

  it('reports non-Error failures while sending messages', () => {
    const store = new TestSocketStore();
    const client = { address: 'client', name: 'Client', userId: 'client' };
    const debuggerConnection = {
      address: 'debugger',
      name: 'Debugger',
      userId: 'Debugger',
    };
    const error = jest.spyOn(psLog, 'error').mockImplementation();
    store.setSocketState(SocketState.OPEN);
    store.socketConnection = client;
    store.debuggerConnection = debuggerConnection;
    store.setSendFailure('transport unavailable');

    store.unicastMessage(
      { role: 'client', type: 'debug', data: { enabled: true } },
      debuggerConnection,
    );

    expect(error).toHaveBeenCalledWith('Incompatible: transport unavailable');
    expect(store.socketConnection).toBeNull();
    store.close();
  });

  it('schedules reconnects with exponential backoff', () => {
    jest.useFakeTimers();
    const store = new TestSocketStore();
    const reconnect = jest.spyOn(store, 'tryReconnect').mockImplementation();

    store.connectOffline();
    jest.advanceTimersByTime(2000);

    expect(reconnect).toHaveBeenCalledTimes(1);
    expect(store.retryInterval).toBe(3000);
    jest.useRealTimers();
  });

  it('cancels a pending reconnect when closed', () => {
    jest.useFakeTimers();
    const store = new TestSocketStore();
    const reconnect = jest.spyOn(store, 'tryReconnect').mockImplementation();

    store.connectOffline();
    store.close();
    jest.advanceTimersByTime(2000);

    expect(reconnect).not.toHaveBeenCalled();
    expect(store.retryTimer).toBeNull();
    jest.useRealTimers();
  });

  it('initializes the socket, sends heartbeats, and schedules a reconnect on close', async () => {
    jest.useFakeTimers();
    const store = new TestSocketStore();

    await store.init('ws://example.com/room');
    store.emitOpen();

    expect(store.socketUrl).toBe('ws://example.com/room');
    expect(store.pingTimer).not.toBeNull();

    jest.advanceTimersByTime(5000);
    expect(JSON.parse(store.getSentPayloads()[0])).toMatchObject({
      type: 'ping',
      content: null,
    });

    store.emitClose();
    expect(store.socketConnection).toBeNull();
    expect(store.debuggerConnection).toBeNull();
    expect(store.retryTimer).not.toBeNull();

    store.close();
    jest.useRealTimers();
  });

  it('stops reconnecting and clears transient state when closed', () => {
    const store = new TestSocketStore();
    const refreshListener = jest.fn();
    store.messages.push({
      type: 'broadcast',
      content: { data: { role: 'client', type: 'console', data: {} } },
    });
    store.addListener('refresh', refreshListener);

    store.close();

    expect(store.connectable).toBe(false);
    expect(store.messages).toEqual([]);
    expect(store.events.refresh).toEqual([]);
    expect(store.getSocket().getState()).toBe(SocketState.CLOSED);
  });
});
