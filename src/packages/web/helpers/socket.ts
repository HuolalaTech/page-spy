import { stringifyData } from 'src/utils';
import { ROOM_SESSION_KEY } from 'src/utils/constants';
import {
  SocketStoreBase,
  SocketState,
  SocketWrapper,
} from 'src/utils/socket-base';

class WebSocketWrapper extends SocketWrapper {
  private socket: WebSocket | null = null;

  init(url: string) {
    this.socket = new WebSocket(url);
    const eventNames = ['open', 'close', 'error', 'message'] as (
      | 'open'
      | 'close'
      | 'error'
      | 'message'
    )[];
    (eventNames as typeof eventNames).forEach((eventName) => {
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
    this.socket = null;
  }

  destroy(): void {
    this.socket = null;
  }

  getState(): SocketState {
    return this.socket?.readyState as SocketState;
  }
}

export class SocketStore extends SocketStoreBase {
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

export default new SocketStore();
