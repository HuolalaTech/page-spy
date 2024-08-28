import {
  SocketState,
  SocketStoreBase,
  SocketWrapper,
  NetworkProxyBase,
  RequestItem,
} from 'page-spy-base/src';

class PlatformSocketWrapper extends SocketWrapper {
  init(url: string): void {
    throw new Error('Method not implemented.');
  }
  send(data: string): void {
    throw new Error('Method not implemented.');
  }
  close(data?: {} | undefined): void {
    throw new Error('Method not implemented.');
  }
  destroy(): void {
    throw new Error('Method not implemented.');
  }
  getState(): SocketState {
    throw new Error('Method not implemented.');
  }
}

class PlatformSocket extends SocketStoreBase {
  protected socketWrapper: SocketWrapper = new PlatformSocketWrapper();
  onOffline(): void {
    throw new Error('Method not implemented.');
  }
}

const socket = new PlatformSocket();

describe('Network Proxy Base Exceptions', () => {
  it('Test `createRequest`', () => {
    const base = new NetworkProxyBase(socket);
    expect(base.createRequest('')).toBe(false);

    const id = '1';
    const item = new RequestItem(id);
    base.setRequest(id, item);

    expect(base.createRequest(id)).toBe(false);

    const newID = '2';
    expect(base.createRequest(newID)).toBe(true);
  });

  it('Test `setRequest`', () => {
    const base = new NetworkProxyBase(socket);
    const id = '1';
    const item = new RequestItem(id);
    expect(base.setRequest(id, item)).toBe(true);
  });
});
