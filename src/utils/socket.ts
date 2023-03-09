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

  constructor() {
    this.addListener('debug', SocketStore.handleDebugger);
    this.addListener('atom-detail', SocketStore.handleResolveAtom);
    this.addListener('atom-getter', SocketStore.handleAtomPropertyGetter);
    this.addListener('debugger-online', this.handleFlushBuffer);
  }

  init(url: string) {
    try {
      if (!url) {
        throw Error('WebSocket 连接 URL 不可缺省');
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
        this.reconnectable = false;
        this.connectOffline();
        throw new Error('WebSocket connect fail');
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
    if (!this.reconnectable) {
      sessionStorage.setItem(
        'page-spy-room',
        JSON.stringify({ usable: false }),
      );
      return;
    }
    this.tryReconnect();
  }

  tryReconnect() {
    if (this.reconnectTimes > 0) {
      this.reconnectTimes -= 1;
      this.init(this.socketUrl);
    } else {
      this.reconnectable = false;
      this.connectOffline();
      console.log('[PageSpy] Reconnect failed.');
    }
  }

  pingConnect() {
    this.timer = window.setInterval(() => {
      if (this.socket?.readyState !== WebSocket.OPEN) return;
      this.send({
        type: 'ping',
        content: null,
      });
    }, 10000);
  }

  clearPing() {
    if (this.timer) {
      window.clearInterval(this.timer);
    }
  }

  // get the data which we expected from nested structure of the message
  private peelMessage() {
    if (this.socket) {
      this.socket.addEventListener('message', (evt) => {
        const result = JSON.parse(evt.data) as SpySocket.Event;
        const { type } = result;
        switch (type) {
          case 'connect':
            const { selfConnection } = result.content;
            this.socketConnection = selfConnection;
            break;
          case 'send':
            const { data, from, to } = result.content;
            if (to.address !== this.socketConnection?.address) return;
            this.dispatchEvent(data.type as SpyMessage.InteractiveType, {
              source: data,
              from,
              to,
            });
            break;
          case 'error':
            this.reconnectable = false;
            this.connectOffline();
            break;
          case 'join':
          case 'ping':
          case 'leave':
          case 'close':
          case 'message':
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

    this.messages
      .slice(msgIndex + 1)
      .forEach((msg: SpySocket.BrodcastEvent | SpySocket.UnicastEvent) => {
        const data = {
          type: 'send',
          content: {
            data: msg.content.data,
            from: this.socketConnection!,
            to: message.from,
          },
        } as const;
        this.send(data, true);
      });
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
    if (this.connectionStatus) {
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
    if (this.timer) {
      window.clearInterval(this.timer);
    }
    this.reconnectable = false;
    this.socket?.close();
  }
}

export default new SocketStore();
