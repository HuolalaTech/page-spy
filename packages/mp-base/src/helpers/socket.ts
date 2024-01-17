import { ROOM_SESSION_KEY } from 'base/src/constants';
import {
  SocketStoreBase,
  SocketState,
  SocketWrapper,
} from 'base/src/socket-base';
import { getMPSDK } from '../utils';

export class MPSocketWrapper extends SocketWrapper {
  private socket: MPSocket | null = null;

  private state: SocketState = 0;

  init(url: string) {
    this.state = SocketState.CONNECTING;
    this.socket = getMPSDK().connectSocket({
      url,
      multiple: true, // for alipay mp to return a task
      complete() {}, // make sure the uniapp return a task
    });
    this.socket.onClose((data) => {
      this.state = SocketState.CLOSED;
      this.emit('close', data);
    });
    this.socket.onError((data) => {
      this.state = SocketState.CLOSED;
      this.emit('error', data);
    });
    this.socket.onOpen((data) => {
      this.state = SocketState.OPEN;
      this.emit('open', data);
    });
    this.socket.onMessage((data) => {
      this.emit('message', data);
    });
  }

  send(data: string) {
    this.socket?.send({
      data,
    });
  }

  close() {
    this.socket?.close({});
    this.state = SocketState.CLOSED;
    this.emit('close', {});
    this.clearListeners();
  }

  destroy(): void {
    this.close();
    this.socket = null;
  }

  getState(): SocketState {
    return this.state;
  }
}

export class MPSocketStore extends SocketStoreBase {
  // websocket instance
  protected socket = new MPSocketWrapper();

  public getSocket() {
    return this.socket;
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
