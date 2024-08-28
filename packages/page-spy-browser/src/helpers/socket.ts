import {
  stringifyData,
  ROOM_SESSION_KEY,
  SocketStoreBase,
  SocketState,
  SocketWrapper,
  WebSocketEvents,
} from '@huolala-tech/page-spy-base';

export class WebSocketWrapper extends SocketWrapper {
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

export class WebSocketStore extends SocketStoreBase {
  // websocket instance
  protected socketWrapper: WebSocketWrapper = new WebSocketWrapper();

  // disable lint: this is an abstract method of parent class, so it cannot be static
  // eslint-disable-next-line class-methods-use-this
  onOffline(): void {
    window.dispatchEvent(new CustomEvent('sdk-inactive'));
    sessionStorage.removeItem(ROOM_SESSION_KEY);
  }
}

export default new WebSocketStore();
