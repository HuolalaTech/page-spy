import webSocket from '@ohos.net.webSocket';
import { psLog, stringifyData } from '../utils';
import {
  SocketStoreBase,
  SocketState,
  SocketWrapper,
} from '../utils/socket-base';

export class OHSocketWrapper extends SocketWrapper {
  public state: SocketState = 0;

  public socketInstance: webSocket.WebSocket | null = null;

  init(url: string) {
    this.state = SocketState.CONNECTING;
    this.socketInstance = webSocket.createWebSocket();
    this.socketInstance.on('open', (err, data) => {
      this.state = SocketState.OPEN;
      this.emit('open', data);
    });
    this.socketInstance.on('close', (err, data) => {
      this.state = SocketState.CLOSED;
      this.emit('close', data);
    });
    this.socketInstance.on('message', (err, data: string) => {
      this.emit('message', data);
    });
    this.socketInstance.on('error', (err) => {
      this.state = SocketState.CLOSED;
      this.emit('error', err);
    });
    this.socketInstance.connect(url, (err, value) => {
      if (!err) {
        psLog.log(`Connect successful.`);
      } else {
        psLog.error('Connect failed, the error: ' + JSON.stringify(err));
      }
    });
  }

  send(data: string) {
    this.socketInstance?.send(stringifyData(data));
  }

  close() {
    this.state = SocketState.CLOSED;
    this.socketInstance?.close();
    this.clearListeners();
  }

  getState(): SocketState {
    return this.state;
  }
}

export class OHSocketStore extends SocketStoreBase {
  protected socketWrapper: OHSocketWrapper = new OHSocketWrapper();

  onOffline(): void {
    // AppStorage.delete(ROOM_SESSION_KEY);
  }
}

const socketStore = new OHSocketStore();

export default socketStore;
