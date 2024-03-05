import { ROOM_SESSION_KEY } from 'base/src/constants';
import {
  SocketStoreBase,
  SocketState,
  SocketWrapper,
} from 'base/src/socket-base';
import { getMPSDK, utilAPI } from '../utils';

export class MPSocketWrapper extends SocketWrapper {
  private socketInstance: MPSocket | null = null;

  private state: SocketState = 0;

  // some ali-family app only support single socket connection...
  public static isSingleSocket = false;

  init(url: string) {
    this.state = SocketState.CONNECTING;
    const mp = getMPSDK();
    const closeHandler: SocketOnCloseHandler = (data) => {
      this.state = SocketState.CLOSED;
      this.emit('close', data);
    };
    const openHandler: SocketOnOpenHandler = (data) => {
      this.state = SocketState.OPEN;
      this.emit('open', data);
    };
    const errorHandler: SocketOnErrorHandler = (data) => {
      this.state = SocketState.CLOSED;
      this.emit('error', data);
    };
    const messageHandler: SocketOnMessageHandler = (data) => {
      this.emit('message', data);
    };

    if (!MPSocketWrapper.isSingleSocket) {
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
    if (MPSocketWrapper.isSingleSocket) {
      getMPSDK().sendSocketMessage({ data });
    } else {
      this.socketInstance?.send({
        data,
      });
    }
  }

  close() {
    if (MPSocketWrapper.isSingleSocket) {
      getMPSDK().closeSocket({});
    } else {
      this.socketInstance?.close({});
    }
    this.state = SocketState.CLOSED;
    this.clearListeners();
  }

  getState(): SocketState {
    return this.state;
  }
}

export class MPSocketStore extends SocketStoreBase {
  // websocket socketInstance
  protected socketWrapper = new MPSocketWrapper();

  public getSocket() {
    return this.socketWrapper;
  }

  constructor() {
    super();
  }

  // this is an abstract method of parent class, cannot be static
  /* eslint-disable-next-line */
  onOffline() {
    utilAPI.setStorage(ROOM_SESSION_KEY, JSON.stringify({ usable: false }));
  }
}

export default new MPSocketStore();
