/**
 * socket base class
 * 不同平台 socket 的 api 不同但功能相同，这里抽象一层
 */

import { getRandomId, psLog, stringifyData } from 'src/utils';
import {
  DEBUG_MESSAGE_TYPE,
  makeMessage,
  makeBroadcastMessage,
  makeUnicastMessage,
} from 'src/utils/message';
import type { SpyMessage, SpySocket } from 'types';
import * as SERVER_MESSAGE_TYPE from 'src/utils/message/server-type';
import atom from 'src/utils/atom';

interface SocketEvent<T = any> {
  source: {
    type: SpyMessage.MessageType;
    data: T;
  };
  from: SpySocket.Connection;
  to: SpySocket.Connection;
}
type SocketEventCallback = (
  data: SocketEvent,
  reply: (data: any) => void,
) => void;

interface GetterMember {
  key: string; // 属性名
  id: string; // 当前键的 id
  parentId: string; // 当前属性所在容器的 id
  instanceId: string; // 当前实例的 id
}

type CallbackType = (data?: any) => void;

// fork WebSocket state
export enum SocketState {
  CONNECTING = 0,
  OPEN = 1,
  CLOSING = 2,
  CLOSED = 3,
}

// 封装不同平台的 socket
export abstract class SocketWrapper {
  abstract init(url: string): void;
  abstract send(data: object): void;
  abstract close(data?: {}): void;
  abstract destroy(): void;
  abstract getState(): SocketState;
  protected events: Record<
    'open' | 'close' | 'error' | 'message',
    CallbackType[]
  > = {
    open: [],
    close: [],
    error: [],
    message: [],
  };

  protected emit(event: 'open' | 'close' | 'error' | 'message', data: any) {
    this.events[event].forEach((fun) => {
      fun(data);
    });
  }

  onOpen(fun: (res: { header?: Record<string, string> }) => void) {
    this.events.open.push(fun);
  }

  onClose(fun: (res: { code: number; reason: string }) => void) {
    this.events.close.push(fun);
  }

  onError(fun: (msg: string) => void) {
    this.events.error.push(fun);
  }

  onMessage(fun: (data: string | ArrayBuffer) => void) {
    this.events.message.push(fun);
  }

}

export abstract class SocketStoreBase {
  protected abstract socket: SocketWrapper;

  private socketUrl: string = '';

  private socketConnection: SpySocket.Connection | null = null;

  private timer: ReturnType<typeof setInterval> | null = null;

  // messages store
  private messages: (SpySocket.BroadcastEvent | SpySocket.UnicastEvent)[] = [];

  // events center
  private events: Record<SpyMessage.InteractiveType, SocketEventCallback[]> = {
    refresh: [],
    debug: [],
    'atom-detail': [],
    'atom-getter': [],
    'debugger-online': [],
    'database-pagination': [],
  };

  // Don't try to reconnect if error occupied
  private reconnectable: boolean = true;

  private reconnectTimes = 3;

  // indicated connected  whether or not
  public connectionStatus: boolean = false;

  constructor() {
    this.addListener('debug', SocketStoreBase.handleDebugger);
    this.addListener('atom-detail', SocketStoreBase.handleResolveAtom);
    this.addListener('atom-getter', SocketStoreBase.handleAtomPropertyGetter);
    this.addListener('debugger-online', this.handleFlushBuffer);
  }

  // Simple offline listener
  abstract onOffline(): void;

  public init(url: string) {
    try {
      if (!url) {
        throw Error('WebSocket url cannot be empty');
      }
      // close existing connection
      if (this.socket.getState() === SocketState.OPEN) {
        this.socket.destroy();
      }
      this.socket?.init(url);
      this.socketUrl = url;
      this.socket?.onOpen(() => {
        this.connectOnline();
        this.socket?.onMessage((evt) => {
          this.handleMessage(evt);
        });
      });
      this.socket?.onClose(() => {
        this.connectOffline();
      });
      this.socket?.onError(() => {
        this.reconnectTimes = 0;
        this.reconnectable = false;
        this.connectOffline();
      });
    } catch (e: any) {
      psLog.error(e.message);
    }
  }

  public addListener(
    type: SpyMessage.InteractiveType,
    fn: SocketEventCallback,
  ) {
    /* c8 ignore next 3 */
    if (!this.events[type]) {
      this.events[type] = [];
    }
    this.events[type].push(fn);
  }

  public broadcastMessage(
    msg: SpyMessage.MessageItem,
    isCache: boolean = false,
  ) {
    const message = makeBroadcastMessage(msg);
    this.send(message, isCache);
  }

  public close() {
    this.clearPing();
    this.reconnectTimes = 0;
    this.reconnectable = false;
    this.socket?.close();
  }

  private connectOnline() {
    this.connectionStatus = true;
    this.reconnectTimes = 3;
    this.pingConnect();
  }

  private connectOffline() {
    this.socket.destroy();
    this.connectionStatus = false;
    this.socketConnection = null;
    this.clearPing();
    if (!this.reconnectable || this.reconnectTimes <= 0) {
      this.onOffline();

      return;
    }

    this.tryReconnect();
  }

  tryReconnect() {
    this.reconnectTimes -= 1;
    this.init(this.socketUrl);
  }

  private pingConnect() {
    /* c8 ignore start */
    this.timer = setInterval(() => {
      if (this.socket?.getState() !== SocketState.OPEN) return;
      this.send({
        type: 'ping',
        content: null,
      });
    }, 10000);
    /* c8 ignore stop */
  }

  private clearPing() {
    if (this.timer) {
      clearInterval(this.timer);
    }
  }

  // get the data which we expected from nested structure of the message
  protected handleMessage(evt: any) {
    const { CONNECT, MESSAGE, ERROR, JOIN, PING, LEAVE, CLOSE, BROADCAST } =
      SERVER_MESSAGE_TYPE;
    const result = JSON.parse(evt.data) as SpySocket.Event;
    const { type } = result;
    switch (type) {
      case CONNECT:
        const { selfConnection } = result.content;
        this.socketConnection = selfConnection;
        break;
      case MESSAGE:
        const { data, from, to } = result.content;
        if (to.address === this.socketConnection?.address) {
          this.dispatchEvent(data.type as SpyMessage.InteractiveType, {
            source: data,
            from,
            to,
          });
        }
        break;
      case ERROR:
        this.reconnectable = false;
        this.connectOffline();
        break;
      /* c8 ignore start */
      case JOIN:
      case PING:
      case LEAVE:
      case CLOSE:
      case BROADCAST:
      default:
        // noting
        break;
      /* c8 ignore stop */
    }
  }

  private dispatchEvent(type: SpyMessage.InteractiveType, data: SocketEvent) {
    this.events[type].forEach((fn) => {
      fn.call(this, data, (d: SpyMessage.MessageItem) => {
        this.unicastMessage(d, data.from);
      });
    });
  }

  private unicastMessage(
    msg: SpyMessage.MessageItem,
    to: SpySocket.Connection,
  ) {
    const message = makeUnicastMessage(msg, this.socketConnection!, to);
    this.send(message);
  }

  private handleFlushBuffer(message: SocketEvent<{ latestId: string }>) {
    const { latestId } = message.source.data;

    const msgIndex = this.messages.findIndex(
      (i) => i.content.data.data.id === latestId,
    );

    /* c8 ignore start */
    this.messages
      .slice(msgIndex + 1)
      .forEach((msg: SpySocket.BroadcastEvent | SpySocket.UnicastEvent) => {
        const data = {
          type: SERVER_MESSAGE_TYPE.MESSAGE,
          content: {
            data: msg.content.data,
            from: this.socketConnection!,
            to: message.from,
          },
        } as const;
        this.send(data, true);
      });
    /* c8 ignore stop */
  }

  // run executable code which received from remote and send back the result
  private static handleDebugger(
    { source }: SocketEvent<string>,
    reply: (data: any) => void,
  ) {
    const { type, data } = source;
    if (type === DEBUG_MESSAGE_TYPE.DEBUG) {
      const originMsg = makeMessage(DEBUG_MESSAGE_TYPE.CONSOLE, {
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
        const evalMsg = makeMessage(DEBUG_MESSAGE_TYPE.CONSOLE, {
          logType: 'debug-eval',
          logs: [atom.transformToAtom(result)],
        });
        reply(evalMsg);
      } catch (err) {
        const errMsg = makeMessage(DEBUG_MESSAGE_TYPE.CONSOLE, {
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

  private static handleResolveAtom(
    { source }: SocketEvent<string>,
    reply: (data: any) => void,
  ) {
    const { type, data } = source;
    if (type === DEBUG_MESSAGE_TYPE.ATOM_DETAIL) {
      const atomData = atom.get(data) || {};
      const msg = makeMessage(`atom-detail-${data}`, atomData, false);
      reply(msg);
    }
  }

  private static handleAtomPropertyGetter(
    { source }: SocketEvent<GetterMember>,
    reply: (data: any) => void,
  ) {
    const { type, data } = source;
    if (type === DEBUG_MESSAGE_TYPE.ATOM_GETTER) {
      const { id, parentId, key, instanceId } = data;
      const instance = atom.getOrigin(instanceId);
      const current = atom.getOrigin(parentId);
      let value = {};
      /* c8 ignore start */
      if (instance && current) {
        value = Object.getOwnPropertyDescriptor(current, key)?.get?.call(
          instance,
        );
      } else {
        value = new Error('Getter computed failed');
      }
      /* c8 ignore stop */
      const msg = makeMessage(`atom-getter-${id}`, atom.transformToAtom(value));
      reply(msg);
    }
  }

  private send(msg: SpySocket.ClientEvent, isCache: boolean = false) {
    if (this.connectionStatus) {
      /* c8 ignore start */
      try {
        this.socket?.send(stringifyData(msg));
      } catch (e) {
        throw Error(`Incompatible: ${(e as Error).message}`);
      }
      /* c8 ignore stop */
    }
    if (!isCache) {
      if (
        [SERVER_MESSAGE_TYPE.MESSAGE, SERVER_MESSAGE_TYPE.PING].indexOf(
          msg.type,
        ) > -1
      ) {
        return;
      }

      this.messages.push(
        msg as Exclude<SpySocket.ClientEvent, SpySocket.PingEvent>,
      );
    }
  }
}

export default SocketStoreBase;
