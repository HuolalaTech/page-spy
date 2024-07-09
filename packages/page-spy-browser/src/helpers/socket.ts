import { stringifyData } from 'base/src';
import { ROOM_SESSION_KEY } from 'base/src/constants';
import { UPDATE_ROOM_INFO } from 'base/src/message/server-type';
import {
  SocketStoreBase,
  SocketState,
  SocketWrapper,
  WebSocketEvents,
} from 'base/src/socket-base';
import { InitConfig } from 'page-spy-browser/types';

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

  public getPageSpyConfig: (() => Required<InitConfig>) | null = null;

  updateRoomInfo() {
    if (this.getPageSpyConfig) {
      const { project, title } = this.getPageSpyConfig();
      this.send(
        {
          type: UPDATE_ROOM_INFO,
          content: {
            info: {
              name: navigator.userAgent,
              group: project,
              tags: {
                title,
                name: navigator.userAgent,
                group: project,
              },
            },
          },
        },
        true,
      );
    }
  }

  public getSocket() {
    return this.socketWrapper;
  }

  // disable lint: this is an abstract method of parent class, so it cannot be static
  // eslint-disable-next-line class-methods-use-this
  onOffline(): void {
    window.dispatchEvent(new CustomEvent('sdk-inactive'));
    sessionStorage.removeItem(ROOM_SESSION_KEY);
  }
}

export default new WebSocketStore();
