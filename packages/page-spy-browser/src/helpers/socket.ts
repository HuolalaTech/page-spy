import { stringifyData } from 'base/src';
import { ROOM_SESSION_KEY } from 'base/src/constants';
import {
  SocketStoreBase,
  SocketState,
  SocketWrapper,
  WebSocketEvents,
} from 'base/src/socket-base';

export class WebSocketWrapper extends SocketWrapper {
  private socketInstance: WebSocket | null = null;

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

export class WebSocketStore extends SocketStoreBase {
  // websocket instance
  protected socketWrapper: WebSocketWrapper = new WebSocketWrapper();

  public getSocket() {
    return this.socketWrapper;
  }

  // disable lint: this is an abstract method of parent class, so it cannot be static
  // eslint-disable-next-line class-methods-use-this
  onOffline(): void {
    window.dispatchEvent(new CustomEvent('sdk-inactive'));
    sessionStorage.setItem(ROOM_SESSION_KEY, JSON.stringify({ usable: false }));
  }

  // eslint-disable-next-line @typescript-eslint/no-useless-constructor
  constructor() {
    super();
  }
}

export default new WebSocketStore();
