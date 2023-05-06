import { getRandomId, stringifyData } from 'src/utils';
import {
  DEBUG_MESSAGE_TYPE,
  makeMessage,
  makeBroadcastMessage,
  makeUnicastMessage,
} from 'src/utils/message';
import type { SpyMessage, SpySocket } from 'types';
import atom from './atom';
import { ROOM_SESSION_KEY } from './constants';
import * as SERVER_MESSAGE_TYPE from './message/server-type';

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

export class SocketStore {
  // websocket instance
  socket: WebSocket | null = null;

  socketUrl: string = '';

  socketConnection: SpySocket.Connection | null = null;

  timer: number | null = null;

  reconnectTimes = 3;

  // messages store
  messages: (SpySocket.BrodcastEvent | SpySocket.UnicastEvent)[] = [];

  // Don't try to reconnect if error occupied
  reconnectable: boolean = true;

  // indicated connected  whether or not
  connectionStatus: boolean = false;

  // events center
  events: Record<SpyMessage.InteractiveType, SocketEventCallback[]> = {
    refresh: [],
    debug: [],
    'atom-detail': [],
    'atom-getter': [],
    'debugger-online': [],
  };

  // Don't try to reconnect and close immediately
  // when user refresh the page.
  closeImmediately: boolean = false;

  constructor() {
    this.addListener('debug', SocketStore.handleDebugger);
    this.addListener('atom-detail', SocketStore.handleResolveAtom);
    this.addListener('atom-getter', SocketStore.handleAtomPropertyGetter);
    this.addListener('debugger-online', this.handleFlushBuffer);
  }

  init(url: string) {
    try {
      if (!url) {
        throw Error('[PageSpy] WebSocket url cannot be empty');
      }
      this.socket = new WebSocket(url);
      this.socketUrl = url;
      this.socket.addEventListener('open', () => {
        this.connectOnline();
        this.peelMessage();
      });
      this.socket.addEventListener('close', () => {
        this.connectOffline();
      });
      this.socket.addEventListener('error', () => {
        this.reconnectTimes = 0;
        this.reconnectable = false;
        this.connectOffline();
      });
    } catch (e: any) {
      alert(`[PageSpy] ${e.message}`);
    }
  }

  connectOnline() {
    this.connectionStatus = true;
    this.reconnectTimes = 3;
    this.pingConnect();
  }

  connectOffline() {
    this.socket = null;
    this.connectionStatus = false;
    this.socketConnection = null;
    this.clearPing();

    if (this.closeImmediately) return;
    this.tryReconnect();
  }

  tryReconnect() {
    if (!this.reconnectable) {
      sessionStorage.setItem(
        ROOM_SESSION_KEY,
        JSON.stringify({ usable: false }),
      );
      return;
    }
    if (this.reconnectTimes > 0) {
      this.reconnectTimes -= 1;
      this.init(this.socketUrl);
    } /* c8 ignore start */ else {
      this.reconnectable = false;
      console.log('[PageSpy] Reconnect failed.');
    }
    /* c8 ignore stop */
  }

  pingConnect() {
    /* c8 ignore start */
    this.timer = window.setInterval(() => {
      if (this.socket?.readyState !== WebSocket.OPEN) return;
      this.send({
        type: 'ping',
        content: null,
      });
    }, 10000);
    /* c8 ignore stop */
  }

  clearPing() {
    if (this.timer) {
      window.clearInterval(this.timer);
    }
  }

  // get the data which we expected from nested structure of the message
  private peelMessage() {
    if (this.socket) {
      const { CONNECT, MESSAGE, ERROR, JOIN, PING, LEAVE, CLOSE, BROADCAST } =
        SERVER_MESSAGE_TYPE;
      this.socket.addEventListener('message', (evt) => {
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
      });
    }
  }

  addListener(type: SpyMessage.InteractiveType, fn: SocketEventCallback) {
    /* c8 ignore next 3 */
    if (!this.events[type]) {
      this.events[type] = [];
    }
    this.events[type].push(fn);
  }

  dispatchEvent(type: SpyMessage.InteractiveType, data: SocketEvent) {
    this.events[type].forEach((fn) => {
      fn.call(this, data, (d: SpyMessage.MessageItem) => {
        this.unicastMessage(d, data.from);
      });
    });
  }

  unicastMessage(msg: SpyMessage.MessageItem, to: SpySocket.Connection) {
    const message = makeUnicastMessage(msg, this.socketConnection!, to);
    this.send(message);
  }

  broadcastMessage(msg: SpyMessage.MessageItem, isCache: boolean = false) {
    const message = makeBroadcastMessage(msg);
    this.send(message, isCache);
  }

  handleFlushBuffer(message: SocketEvent<{ latestId: string }>) {
    const { latestId } = message.source.data;

    const msgIndex = this.messages.findIndex(
      (i) => i.content.data.data.id === latestId,
    );

    /* c8 ignore start */
    this.messages
      .slice(msgIndex + 1)
      .forEach((msg: SpySocket.BrodcastEvent | SpySocket.UnicastEvent) => {
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

  // run excutable code which received from remote and send back the result
  static handleDebugger(
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

  static handleResolveAtom(
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

  static handleAtomPropertyGetter(
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

  send(msg: SpySocket.ClientEvent, isCache: boolean = false) {
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

  close() {
    this.clearPing();
    this.closeImmediately = true;
    this.socket?.close();
  }
}

export default new SocketStore();
