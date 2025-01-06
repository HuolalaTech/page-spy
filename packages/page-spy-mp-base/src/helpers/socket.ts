import {
  SocketStoreBase,
  SocketState,
  SocketWrapper,
} from '@huolala-tech/page-spy-base/dist/socket-base';
import { ROOM_SESSION_KEY } from '@huolala-tech/page-spy-base/dist/constants';
import {
  MPSocket,
  SocketOnCloseHandler,
  SocketOnErrorHandler,
  SocketOnMessageHandler,
  SocketOnOpenHandler,
} from '../types';
import { getMPSDK } from './mp-api';

export class MPSocketWrapper extends SocketWrapper {
  public socketInstance: MPSocket | null = null;

  public state: SocketState = 0;

  // some ali-family app only support single socket connection...
  public static isSingleSocket = false;

  async init(url: string) {
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
      let task = mp.connectSocket({
        url,
        multiple: true, // for alipay mp to return a task
        complete() {}, // make sure the uniapp return a task
      });
      if (task instanceof Promise) {
        task = await task;
      }
      task.onClose(closeHandler);
      task.onError(errorHandler);
      task.onOpen(openHandler);
      task.onMessage(messageHandler);
      this.socketInstance = task;
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
  }

  getState(): SocketState {
    return this.state;
  }
}

export class MPSocketStore extends SocketStoreBase {
  // websocket socketInstance
  protected socketWrapper = new MPSocketWrapper();

  // this is an abstract method of parent class, cannot be static
  /* eslint-disable-next-line */
  onOffline() {
    const mp = getMPSDK();
    mp.removeStorageSync(ROOM_SESSION_KEY);
  }
}

export default new MPSocketStore();
