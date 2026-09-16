import { SocketState, SocketStoreBase, SocketWrapper } from 'page-spy-base/src';

class TestSocketWrapper extends SocketWrapper {
  public state = SocketState.CLOSED;

  init(): void {
    this.state = SocketState.OPEN;
  }

  send(): void {}

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

  processMessage(data: string) {
    this.handleMessage({ data });
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

  it('schedules reconnects with exponential backoff', () => {
    jest.useFakeTimers();
    const store = new TestSocketStore();
    const reconnect = jest.spyOn(store, 'tryReconnect').mockImplementation();

    store.connectOffline();
    jest.advanceTimersByTime(2000);

    expect(reconnect).toHaveBeenCalledTimes(1);
    expect(store.retryInterval).toBe(3000);
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
