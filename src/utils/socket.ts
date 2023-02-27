import { getRandomId, stringifyData } from 'src/utils';
import {
  MESSAGE_TYPE,
  makeMessage,
  makeBroadcastMessage,
  makeUnicastMessage,
} from 'src/utils/message';
import type { SpyMessage, SpySocket } from 'types';
import atom from './atom';

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

class SocketStore {
  // websocket instance
  socket: WebSocket | null = null;

  socketConnection: SpySocket.Connection | null = null;

  pingTimer: number | null = null;

  reconnectTimes = 3;

  // messages store
  messages: (SpySocket.BrodcastEvent | SpySocket.UnicastEvent)[] = [];

  // indicated connected  whether or not
  isInited: boolean = false;

  // events center
  events: Record<SpyMessage.InteractiveType, SocketEventCallback[]> = {
    refresh: [],
    debug: [],
    'atom-detail': [],
    'atom-getter': [],
  };

  constructor() {
    this.addListener('debug', SocketStore.handleDebugger);
    this.addListener('atom-detail', SocketStore.handleResolveAtom);
    this.addListener('atom-getter', SocketStore.handleAtomPropertyGetter);
  }

  init(url: string) {
    try {
      if (!url) {
        throw Error('WebSocket 连接 URL 不可缺省');
      }
      this.socket = new WebSocket(url);
      this.socket.addEventListener('open', () => {
        this.isInited = true;
        this.keepConnect();
        this.peelMessage();
      });
      this.socket.addEventListener('close', () => {
        this.isInited = false;
        if (this.pingTimer) {
          window.clearInterval(this.pingTimer);
        }
        this.tryReconnect();
      });
      this.socket.addEventListener('error', () => {
        this.isInited = false;
        this.socket = null;
        throw Error('WebSocket 连接失败');
      });
    } catch (e: any) {
      alert(`[PageSpy] ${e.message}`);
    }
  }

  tryReconnect() {
    if (this.reconnectTimes > 0) {
      this.reconnectTimes -= 1;
      if (this.socket!.readyState !== WebSocket.OPEN) {
        setTimeout(() => {
          this.init(this.socket!.url);
        }, 1000);
      }
    } else {
      this.socket = null;
      if (this.pingTimer) {
        window.clearInterval(this.pingTimer);
      }
      sessionStorage.setItem(
        'page-spy-room',
        JSON.stringify({ usable: false }),
      );
      console.log('[PageSpy] Reconnect failed.');
    }
  }

  keepConnect() {
    this.pingTimer = window.setInterval(() => {
      if (this.socket?.readyState !== WebSocket.OPEN) return;
      this.send({
        type: 'ping',
        content: null,
      });
    }, 10000);
  }

  // get the data which we expected from nested structure of the message
  private peelMessage() {
    if (this.socket) {
      this.socket.addEventListener('message', (evt) => {
        const result = JSON.parse(evt.data) as SpySocket.Event;
        const { type } = result;
        const { data, from, to, selfConnection } = result.content;
        const { address } = result.content.connection;
        switch (type) {
          case 'connect':
            this.socketConnection = selfConnection;
            break;
          case 'join':
            if (
              this.socketConnection &&
              this.socketConnection.address !== address
            ) {
              this.sendBuffer(result.content.connection);
            }
            break;
          case 'send':
            if (to.address !== this.socketConnection?.address) return;
            this.dispatchEvent(data.type as SpyMessage.InteractiveType, {
              source: data,
              from,
              to,
            });
            break;
          case 'ping':
          case 'leave':
          case 'close':
          case 'message':
          case 'error':
          default:
            break;
        }
      });
    }
  }

  addListener(type: SpyMessage.InteractiveType, fn: SocketEventCallback) {
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

  /**
   * unicast
   * @param msg message
   * @param to target address
   */
  unicastMessage(msg: SpyMessage.MessageItem, to: SpySocket.Connection) {
    const message = makeUnicastMessage(msg, this.socketConnection!, to);
    this.send(message);
  }

  /**
   * boradcast
   * @param msg message
   */
  broadcastMessage(msg: SpyMessage.MessageItem, isCache: boolean = false) {
    const message = makeBroadcastMessage(msg);
    this.send(message, isCache);
  }

  private sendBuffer(to: SpySocket.Connection) {
    this.messages.forEach(
      (msg: SpySocket.BrodcastEvent | SpySocket.UnicastEvent) => {
        const data = {
          type: 'send',
          content: {
            data: msg.content.data,
            from: this.socketConnection!,
            to,
          },
        } as const;
        this.send(data, true);
      },
    );
  }

  // run excutable code which received from remote and send back the result
  static handleDebugger(
    { source }: SocketEvent<string>,
    reply: (data: any) => void,
  ) {
    const { type, data } = source;
    if (type === MESSAGE_TYPE.debug) {
      const originMsg = makeMessage(MESSAGE_TYPE.console, {
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
        const evalMsg = makeMessage(MESSAGE_TYPE.console, {
          logType: 'debug-eval',
          logs: [atom.transformToAtom(result)],
        });
        reply(evalMsg);
      } catch (err) {
        const errMsg = makeMessage(MESSAGE_TYPE.console, {
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
    if (type === MESSAGE_TYPE['atom-detail']) {
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
    if (type === MESSAGE_TYPE['atom-getter']) {
      const { id, parentId, key, instanceId } = data;
      const instance = atom.getOrigin(instanceId);
      const current = atom.getOrigin(parentId);
      let value = {};
      if (instance && current) {
        value = Object.getOwnPropertyDescriptor(current, key)?.get?.call(
          instance,
        );
      } else {
        value = new Error('Getter computed failed');
      }
      const msg = makeMessage(`atom-getter-${id}`, atom.transformToAtom(value));
      reply(msg);
    }
  }

  send(msg: SpySocket.ClientEvent, isCache: boolean = false) {
    if (this.isInited) {
      try {
        this.socket?.send(stringifyData(msg));
      } catch (e) {
        throw Error(`Incompatible: ${(e as Error).message}`);
      }
    }
    if (isCache) return;
    if (['send', 'ping'].indexOf(msg.type) > -1) return;
    this.messages.push(
      msg as Exclude<SpySocket.ClientEvent, SpySocket.PingEvent>,
    );
  }

  close() {
    if (this.pingTimer) {
      window.clearInterval(this.pingTimer);
    }
    this.socket?.close();
  }
}

export default new SocketStore();
