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
});
