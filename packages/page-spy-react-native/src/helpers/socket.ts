import {
  SocketStoreBase,
  SocketState,
  SocketWrapper,
  WebSocketEvents,
} from '@huolala-tech/page-spy-base/dist/socket-base';
import { stringifyData } from '@huolala-tech/page-spy-base/dist/utils';

export class RNWebSocketWrapper extends SocketWrapper {
  public socketInstance: WebSocket | null = null;

  init(url: string) {
    this.socketInstance = new WebSocket(url);
    const eventNames: WebSocketEvents[] = ['open', 'close', 'error', 'message'];
    eventNames.forEach((eventName) => {
      this.socketInstance!.addEventListener(eventName, (data) => {
        this.events[eventName].forEach((cb) => {
          cb(data);
        });
      });
    });
  }

  send(data: string) {
    this.socketInstance?.send(stringifyData(data));
  }

  close() {
    this.socketInstance?.close();
  }

  getState(): SocketState {
    return this.socketInstance?.readyState as SocketState;
  }
}

export class RNWebSocketStore extends SocketStoreBase {
  // websocket instance
  protected socketWrapper: RNWebSocketWrapper = new RNWebSocketWrapper();

  // disable lint: this is an abstract method of parent class, so it cannot be static
  // eslint-disable-next-line class-methods-use-this
  onOffline(): void {}

  // eslint-disable-next-line @typescript-eslint/no-useless-constructor
  constructor() {
    super();
  }
}

const socketStore = new RNWebSocketStore();

export default socketStore;
