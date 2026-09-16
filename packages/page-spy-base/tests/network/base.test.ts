import {
  SocketState,
  SocketStoreBase,
  SocketWrapper,
  NetworkProxyBase,
  psLog,
  RequestItem,
  ReqReadyState,
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

class TestNetworkProxy extends NetworkProxyBase {
  public sendRequest(id: string, request: RequestItem) {
    this.sendRequestItem(id, request);
  }
}

describe('Network Proxy Base Exceptions', () => {
  let socket: PlatformSocket;

  beforeEach(() => {
    socket = new PlatformSocket();
    NetworkProxyBase.dataProcessor = undefined;
  });

  afterEach(() => {
    jest.restoreAllMocks();
    jest.useRealTimers();
  });

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
    expect(base.setRequest('', item)).toBe(false);
  });

  it('does not send requests rejected by a data processor', () => {
    const base = new TestNetworkProxy(socket);
    const request = new RequestItem('request-id');
    const dispatchEvent = jest
      .spyOn(socket, 'dispatchEvent')
      .mockImplementation(() => {});
    const broadcastMessage = jest
      .spyOn(socket, 'broadcastMessage')
      .mockImplementation(() => {});
    NetworkProxyBase.dataProcessor = () => false;

    base.sendRequest(request.id, request);

    expect(dispatchEvent).not.toHaveBeenCalled();
    expect(broadcastMessage).not.toHaveBeenCalled();
    expect(base.getRequestMap()[request.id]).toBeUndefined();
  });

  it('dispatches and broadcasts active requests', () => {
    const base = new TestNetworkProxy(socket);
    const request = new RequestItem('request-id');
    request.readyState = ReqReadyState.OPENED;
    const dispatchEvent = jest
      .spyOn(socket, 'dispatchEvent')
      .mockImplementation(() => {});
    const broadcastMessage = jest
      .spyOn(socket, 'broadcastMessage')
      .mockImplementation(() => {});

    base.sendRequest(request.id, request);

    expect(base.getRequestMap()[request.id]).toBe(request);
    expect(dispatchEvent).toHaveBeenCalledWith(
      'public-data',
      expect.objectContaining({ type: 'network' }),
    );
    expect(broadcastMessage).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'network' }),
      true,
    );
  });

  it('removes completed requests after the retention delay', () => {
    jest.useFakeTimers();
    const base = new TestNetworkProxy(socket);
    const request = new RequestItem('request-id');
    request.readyState = ReqReadyState.DONE;
    jest.spyOn(socket, 'dispatchEvent').mockImplementation(() => {});
    jest.spyOn(socket, 'broadcastMessage').mockImplementation(() => {});

    base.sendRequest(request.id, request);
    expect(base.getRequestMap()[request.id]).toBe(request);

    jest.advanceTimersByTime(3000);
    expect(base.getRequestMap()[request.id]).toBeUndefined();
  });

  it('reports non-Error failures from request dispatch', () => {
    const base = new TestNetworkProxy(socket);
    const request = new RequestItem('request-id');
    const error = jest.spyOn(psLog, 'error').mockImplementation();
    jest.spyOn(socket, 'dispatchEvent').mockImplementation(() => {
      throw 'dispatch unavailable';
    });

    base.sendRequest(request.id, request);

    expect(error).toHaveBeenCalledWith('dispatch unavailable');
  });
});
