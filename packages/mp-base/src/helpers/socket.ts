import { ROOM_SESSION_KEY } from 'base/src/constants';
import { SocketStoreBase, SocketState, ISocket } from 'base/src/socket-base';
import { getMPSDK, utilAPI } from '../utils';
import { EventEmitter } from 'base/src/event-emitter';

// Mini program implementation of ISocket
export class MPSocketImpl
  extends EventEmitter<'open' | 'close' | 'error' | 'message', Function>
  implements ISocket
{
  private socketInstance: MPSocket | null = null;

  private _state: SocketState = SocketState.CONNECTING;

  get readyState() {
    return this._state;
  }

  // some ali-family app only support single socket connection...
  public static isSingleSocket = false;

  constructor(url: string) {
    super();
    this._state = SocketState.CONNECTING;
    const mp = getMPSDK();
    const closeHandler: SocketOnCloseHandler = (data) => {
      this._state = SocketState.CLOSED;
      this.emit('close', data);
    };
    const openHandler: SocketOnOpenHandler = (data) => {
      this._state = SocketState.OPEN;
      this.emit('open', data);
    };
    const errorHandler: SocketOnErrorHandler = (data) => {
      this._state = SocketState.CLOSED;
      this.emit('error', data);
    };
    const messageHandler: SocketOnMessageHandler = (data) => {
      this.emit('message', data);
    };
    if (!MPSocketImpl.isSingleSocket) {
      this.socketInstance = mp.connectSocket({
        url,
        multiple: true, // for alipay mp to return a task
        complete() {}, // make sure the uniapp return a task
      });
      this.socketInstance.onClose(closeHandler);
      this.socketInstance.onError(errorHandler);
      this.socketInstance.onOpen(openHandler);
      this.socketInstance.onMessage(messageHandler);
    } else {
      mp.connectSocket({ url });
      mp.onSocketClose(closeHandler);
      mp.onSocketError(errorHandler);
      mp.onSocketMessage(messageHandler);
      mp.onSocketOpen(openHandler);
    }
  }

  send(data: string) {
    if (MPSocketImpl.isSingleSocket) {
      getMPSDK().sendSocketMessage({ data });
    } else {
      this.socketInstance?.send({
        data,
      });
    }
  }

  close() {
    if (MPSocketImpl.isSingleSocket) {
      getMPSDK().closeSocket({});
    } else {
      this.socketInstance?.close({});
    }
    this._state = SocketState.CLOSED;
    this.clearAllListeners();
  }

  getState(): SocketState {
    return this._state;
  }
}

export class MPSocketStore extends SocketStoreBase {
  // websocket socketInstance

  constructor() {
    super();
  }

  // this is an abstract method of parent class, cannot be static
  /* eslint-disable-next-line */
  onOffline() {
    utilAPI.setStorage(ROOM_SESSION_KEY, JSON.stringify({ usable: false }));
  }

  createSocket(url: string): ISocket {
    return new MPSocketImpl(url);
  }
}

export default new MPSocketStore();
