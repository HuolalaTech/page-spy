import { SocketState, SocketStoreBase, ISocket } from 'base/src/socket-base';
import NetworkProxyBase from 'base/src/network/base';
import RequestItem from 'base/src/request-item';

class PlatformSocketImpl implements ISocket {
  readyState: SocketState = 0;
  constructor(url: string) {
    this.init(url);
  }
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
  addEventListener(
    event: keyof WebSocketEventMap,
    callback: (data?: any) => void,
  ): void {}
  removeEventListener(
    event: keyof WebSocketEventMap,
    callback: (data?: any) => void,
  ): void {}
}
class PlatformSocket extends SocketStoreBase {
  createSocket(url: string): ISocket {
    return new PlatformSocketImpl(url);
  }
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
