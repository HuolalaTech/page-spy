import { stringifyData } from 'src/utils';
import { ROOM_SESSION_KEY } from 'src/utils/constants';
import {
  SocketStoreBase,
  SocketState,
  SocketWrapper,
  WebSocketEvents,
} from 'src/utils/socket-base';

export class WebSocketWrapper extends SocketWrapper {
  private socket: WebSocket | null = null;

  init(url: string) {
    this.socket = new WebSocket(url);
    const eventNames: WebSocketEvents[] = ['open', 'close', 'error', 'message'];
    eventNames.forEach((eventName) => {
      this.socket!.addEventListener(eventName, (data) => {
        this.events[eventName].forEach((cb) => {
          cb(data);
        });
      });
    });
  }

  send(data: object) {
    this.socket?.send(stringifyData(data));
  }

  close() {
    this.socket?.close();
    // this.clearListeners();
  }

  destroy(): void {
    this.close();
    this.socket = null;
  }

  getState(): SocketState {
    return this.socket?.readyState as SocketState;
  }
}

export class WebSocketStore extends SocketStoreBase {
  // websocket instance
  protected socket: WebSocketWrapper = new WebSocketWrapper();

  public getSocket() {
    return this.socket;
  }

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
