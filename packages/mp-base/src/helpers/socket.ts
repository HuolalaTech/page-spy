import { ROOM_SESSION_KEY } from 'base/src/constants';
import {
  SocketStoreBase,
  SocketState,
  SocketWrapper,
} from 'base/src/socket-base';
import { getMPSDK } from '../utils';

export class MPSocketWrapper extends SocketWrapper {
  private socketInstance: MPSocket | null = null;

  private state: SocketState = 0;

  init(url: string) {
    this.state = SocketState.CONNECTING;
    this.socketInstance = getMPSDK().connectSocket({
      url,
      multiple: true, // for alipay mp to return a task
      complete() {}, // make sure the uniapp return a task
    });
    this.socketInstance.onClose((data) => {
      this.state = SocketState.CLOSED;
      this.emit('close', data);
    });
    this.socketInstance.onError((data) => {
      this.state = SocketState.CLOSED;
      this.emit('error', data);
    });
    this.socketInstance.onOpen((data) => {
      this.state = SocketState.OPEN;
      this.emit('open', data);
    });
    this.socketInstance.onMessage((data) => {
      this.emit('message', data);
    });
  }

  send(data: string) {
    this.socketInstance?.send({
      data,
    });
  }

  close() {
    this.socketInstance?.close({});
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

  // this is an abstract method of parent class, cannot be static
  /* eslint-disable-next-line */
  onOffline() {
    getMPSDK().setStorageSync(
      ROOM_SESSION_KEY,
      JSON.stringify({ usable: false }),
    );
  }
}

export default new MPSocketStore();
