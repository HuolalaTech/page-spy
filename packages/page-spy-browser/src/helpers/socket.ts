import { getRandomId, stringifyData } from 'base/src';
import atom from 'base/src/atom';
import { ROOM_SESSION_KEY } from 'base/src/constants';
import { makeMessage } from 'base/src/message';
import {
  SocketStoreBase,
  SocketState,
  SocketWrapper,
  WebSocketEvents,
} from 'base/src/socket-base';
import { SpyBase } from 'packages/page-spy-types';

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
    this.addListener('debug', WebSocketStore.handleDebugger);
  }

  // run executable code which received from remote and send back the result
  private static handleDebugger(
    { source }: SpyBase.InteractiveEvent<string>,
    reply: (data: any) => void,
  ) {
    const { type, data } = source;
    if (type === 'debug') {
      const originMsg = makeMessage('console', {
        logType: 'debug-origin',
        logs: [
          {
            id: getRandomId(),
            type: 'debug-origin',
            value: data,
          },
        ],
      });
      reply(originMsg);
      try {
        // eslint-disable-next-line no-new-func, @typescript-eslint/no-implied-eval
        const result = new Function(`return ${data}`)();
        const evalMsg = makeMessage('console', {
          logType: 'debug-eval',
          logs: [atom.transformToAtom(result)],
        });
        reply(evalMsg);
      } catch (err) {
        const errMsg = makeMessage('console', {
          logType: 'error',
          logs: [
            {
              type: 'error',
              value: (err as Error).stack,
            },
          ],
        });
        reply(errMsg);
      }
    }
  }
}

export default new WebSocketStore();
