/**
 * socket base class
 * 不同平台 socket 的 api 不同但功能相同，这里抽象一层
 */

import { getRandomId, psLog, stringifyData } from './index';
import {
  makeMessage,
  makeBroadcastMessage,
  makeUnicastMessage,
} from './message';
import * as SERVER_MESSAGE_TYPE from './message/server-type';
import atom from './atom';
import { InitConfig, SpyBase, SpyMessage, SpySocket } from '../types';
import { PackedEvent } from '../types/lib/socket-event';
import Client from './client';

type InteractiveType = SpyMessage.InteractiveType;
type InternalMsgType = SpyMessage.InternalMsgType;

interface GetterMember {
  key: string; // 属性名
  id: string; // 当前键的 id
  parentId: string; // 当前属性所在容器的 id
  instanceId: string; // 当前实例的 id
}

export type WebSocketEvents = 'open' | 'close' | 'message' | 'error';

type CallbackType = (data?: any) => void;

// fork WebSocket state
export enum SocketState {
  CONNECTING = 0,
  OPEN = 1,
  CLOSING = 2,
  CLOSED = 3,
}

const HEARTBEAT_INTERVAL = 5000;

// The reconnect interval has an initial time of 2000 ms,
// for each failed reconnection attempt, the time will be increased by 1.5x,
// until the attempt number reaches 4, the time will be fixed, which is Math.pow(1.5, 4) * 2000.
// retry interval
const INIT_RETRY_INTERVAL = 2000;
// retry interval time will increase by 1.5x each time.
const RETRY_TIME_INCR = 1.5;
// the time increase pow limit.
const MAX_RETRY_INTERVAL = Math.pow(RETRY_TIME_INCR, 4) * INIT_RETRY_INTERVAL;

export type UpdateConfig = {
  title?: string;
  project?: string;
  name?: string;
};

// 封装不同平台的 socket
export abstract class SocketWrapper {
  abstract init(url: string): void;

  abstract send(data: string): void;

  abstract close(data?: {}): void;

  abstract getState(): SocketState;

  events: Record<WebSocketEvents, CallbackType[]> = {
    open: [],
    close: [],
    error: [],
    message: [],
  };

  protected emit(event: WebSocketEvents, data: any) {
    this.events[event].forEach((fun) => {
      fun(data);
    });
    // for close and error, clear all listeners or they will be called on next socket instance.
    if (event === 'close' || event === 'error') {
      this.clearListeners();
    }
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

  onMessage(fun: (data: string) => void) {
    this.events.message.push(fun);
  }

  clearListeners() {
    // clear listeners
    Object.entries(this.events).forEach(([, funs]) => {
      funs.splice(0);
    });
  }
}

export abstract class SocketStoreBase {
  protected abstract socketWrapper: SocketWrapper;

  public getSocket() {
    return this.socketWrapper;
  }

  public socketUrl: string = '';

  public socketConnection: SpySocket.Connection | null = null;

  public debuggerConnection: SpySocket.Connection | null = null;

  // ping timer used for send next ping.
  // a ping is sent after last msg (normal msg or pong) received.
  public pingTimer: ReturnType<typeof setTimeout> | null = null;

  // pong timer used for waiting for pong, if pong not received, close the connection
  public pongTimer: ReturnType<typeof setTimeout> | null = null;

  public retryTimer: ReturnType<typeof setTimeout> | null = null;

  // Cache messages only in online mode
  public isOffline = false;

  // Maximum message length,
  // the 0 meant no limitation.
  public messageCapacity: number = 0;

  // messages store
  public messages: SpySocket.BroadcastEvent[] = [];

  // events center
  public events: Record<
    InteractiveType | InternalMsgType,
    SpyBase.EventCallback[]
  > = {
    debug: [],
    refresh: [],
    'atom-detail': [],
    'atom-getter': [],
    'debugger-online': [],
    'database-pagination': [],
    'public-data': [],
  };

  // initial retry interval.
  public retryInterval = INIT_RETRY_INTERVAL;

  connectable = true;

  public getPageSpyConfig: (() => Required<InitConfig>) | null = null;

  updateRoomInfo() {
    if (this.getPageSpyConfig) {
      const { project, title } = this.getPageSpyConfig();
      const name = Client.getName();

      this.send(
        {
          type: SERVER_MESSAGE_TYPE.UPDATE_ROOM_INFO,
          content: {
            info: {
              name,
              group: project,
              tags: {
                title,
                name,
                group: project,
              },
            },
          },
        },
        true,
      );
    }
  }

  // response message filters, to handle some wired messages
  public static messageFilters: ((data: any) => any)[] = [];

  constructor() {
    this.addListener('atom-detail', SocketStoreBase.handleResolveAtom);
    this.addListener('atom-getter', SocketStoreBase.handleAtomPropertyGetter);
    this.addListener('debugger-online', this.handleFlushBuffer);
  }

  // Simple offline listener
  abstract onOffline(): void;

  public async init(url: string) {
    try {
      if (!url) {
        throw Error('WebSocket url cannot be empty');
      }
      this.socketWrapper.clearListeners();
      // close existing connection
      if (this.socketWrapper.getState() === SocketState.OPEN) {
        // make sure the existing connection closed.
        // we need to register new handlers immediately.
        await new Promise<void>((resolve) => {
          this.socketWrapper.onClose(() => {
            this.socketWrapper.clearListeners();
            resolve();
          });
          this.socketWrapper.close();
        });
      }
      // once the connection opened, the promise resolved.
      await new Promise<void>((resolve) => {
        this.socketWrapper?.onOpen(() => {
          this.connectOnline();
          resolve();
        });
        // Strictly, the onMessage should be called after onOpen. But for some platform(alipay,)
        // this may cause some message losing.
        this.socketWrapper?.onMessage((evt) => {
          this.handleMessage(evt);
        });
        this.socketWrapper?.onClose(() => {
          this.connectOffline();
        });
        this.socketWrapper?.onError(() => {
          // we treat on error the same with on close.
          this.connectOffline();
        });
        this.socketUrl = url;
        this.socketWrapper?.init(url);
      });
      // true means the connection is established.
      return true;
    } catch (e: any) {
      psLog.error(e.message);
    }
  }

  public addListener(
    type: SpyMessage.InteractiveType,
    fn: SpyBase.InteractiveEventCallback,
  ): void;

  public addListener(
    type: InternalMsgType,
    fn: SpyBase.InternalEventCallback,
  ): void;

  public addListener(type: any, fn: any) {
    if (!this.events[type]) {
      this.events[type] = [];
    }
    this.events[type].push(fn);
  }

  public broadcastMessage(
    msg: SpyMessage.MessageItem<SpyMessage.DataType>,
    noCache: boolean = false,
  ) {
    const message = makeBroadcastMessage(msg);
    this.send(message, noCache);
  }

  public close() {
    this.connectable = false;
    this.clearPing();
    this.socketWrapper?.close();
    this.messages = [];
    Object.entries(this.events).forEach(([, fns]) => {
      if (['atom-detail', 'atom-getter', 'debugger-online']) return;
      fns.splice(0);
    });
  }

  public connectOnline() {
    this.retryInterval = INIT_RETRY_INTERVAL;
    this.updateRoomInfo();
    this.ping();
  }

  public connectOffline() {
    this.socketConnection = null;
    this.debuggerConnection = null;
    this.clearPing();

    if (this.retryTimer) {
      clearTimeout(this.retryTimer);
    }
    if (!this.connectable) return;
    this.retryTimer = setTimeout(() => {
      if (this.retryInterval < MAX_RETRY_INTERVAL) {
        this.retryInterval *= RETRY_TIME_INCR;
      }
      this.retryTimer = null;
      this.tryReconnect();
    }, this.retryInterval);
  }

  tryReconnect() {
    this.init(this.socketUrl);
  }

  public ping() {
    if (this.pingTimer) {
      clearTimeout(this.pingTimer);
    }
    if (this.pongTimer) {
      clearTimeout(this.pongTimer);
    }
    this.pingTimer = setTimeout(() => {
      this.send({
        type: 'ping',
        content: null,
      });
      this.pingTimer = null;
      this.pongTimer = setTimeout(() => {
        // lost connection
        this.connectOffline();
        this.pongTimer = null;
      }, HEARTBEAT_INTERVAL);
    }, HEARTBEAT_INTERVAL);
  }

  public clearPing() {
    if (this.pingTimer) {
      clearTimeout(this.pingTimer);
      this.pingTimer = null;
    }
    if (this.pongTimer) {
      clearTimeout(this.pongTimer);
      this.pongTimer = null;
    }
  }

  public handlePong() {
    clearTimeout(this.pongTimer!);
    this.pongTimer = null;
    this.ping();
  }

  // get the data which we expected from nested structure of the message
  protected handleMessage(evt: string) {
    if (SocketStoreBase.messageFilters.length) {
      SocketStoreBase.messageFilters.forEach((filter) => {
        evt = filter(evt);
      });
    }
    const {
      CONNECT,
      MESSAGE,
      ERROR,
      JOIN,
      PING,
      PONG,
      LEAVE,
      CLOSE,
      BROADCAST,
    } = SERVER_MESSAGE_TYPE;
    const result = JSON.parse(evt) as SpySocket.Event;
    const { type } = result;
    switch (type) {
      case CONNECT:
        const { selfConnection, roomConnections } = result.content;
        this.socketConnection = selfConnection;
        this.debuggerConnection =
          roomConnections.find((i) => i.userId === 'Debugger') || null;
        break;
      case JOIN:
      case LEAVE:
        const { connection } = result.content;
        if (connection.userId === 'Debugger') {
          if (type === JOIN) {
            this.debuggerConnection = connection;
            this.sendClientInfo();
          } else {
            this.debuggerConnection = null;
          }
        }
        break;
      case MESSAGE:
        const { data, from, to } = result.content;
        if (to.address === this.socketConnection?.address) {
          this.dispatchEvent(data.type, {
            source: data,
            from,
            to,
          });
        }
        break;
      case CLOSE:
      case ERROR:
        this.connectOffline();
        break;
      case PONG:
      case PING:
      case BROADCAST:
      default:
        // noting
        break;
    }
    // whatever the type is, we should handle pong
    this.handlePong();
  }

  public dispatchEvent(
    type: SpyMessage.InteractiveType,
    data: SpyBase.InteractiveEvent,
  ): void;

  public dispatchEvent(type: InternalMsgType, data: any): void;

  public dispatchEvent(type: any, data: any) {
    if (['public-data'].includes(type)) {
      this.events['public-data'].forEach((fn) => {
        (fn as SpyBase.InternalEventCallback)(data);
      });
      return;
    }
    this.events[type]?.forEach((fn) => {
      (fn as SpyBase.InteractiveEventCallback).call(
        this,
        data,
        (d: SpyMessage.MessageItem<SpyMessage.InteractiveType>) => {
          this.unicastMessage(d, data.from);
        },
      );
    });
  }

  public unicastMessage(
    msg: SpyMessage.MessageItem<SpyMessage.InteractiveType>,
    to: SpySocket.Connection,
  ) {
    const message = makeUnicastMessage(msg, this.socketConnection!, to);
    this.send(message);
  }

  public handleFlushBuffer(
    message: SpyBase.InteractiveEvent<{ latestId: string }>,
  ) {
    const { latestId } = message.source.data;

    const msgIndex = this.messages.findIndex(
      (i) => i.content.data.data.id === latestId,
    );

    this.messages.slice(msgIndex + 1).forEach((msg) => {
      const data: SpySocket.UnicastEvent = {
        type: SERVER_MESSAGE_TYPE.MESSAGE,
        content: {
          data: msg.content.data as any,
          from: this.socketConnection!,
          to: message.from,
        },
      };
      this.send(data, true);
    });
  }

  public static handleResolveAtom(
    { source }: SpyBase.InteractiveEvent<string>,
    reply: (data: any) => void,
  ) {
    const { type, data } = source;
    if (type === 'atom-detail') {
      const atomData = atom.get(data) || {};
      const msg = makeMessage(`atom-detail-${data}`, atomData, false);
      reply(msg);
    }
  }

  public static handleAtomPropertyGetter(
    { source }: SpyBase.InteractiveEvent<GetterMember>,
    reply: (data: any) => void,
  ) {
    const { type, data } = source;
    if (type === 'atom-getter') {
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

  protected send(msg: SpySocket.ClientEvent, noCache: boolean = false) {
    const sendable = this.checkIfSend(msg);
    if (sendable) {
      try {
        const pkMsg = msg as PackedEvent;
        pkMsg.createdAt = Date.now();
        pkMsg.requestId = getRandomId();
        const dataString = stringifyData(pkMsg);
        this.socketWrapper?.send(dataString);
      } catch (e) {
        psLog.error(`Incompatible: ${(e as Error).message}`);
        this.connectOffline();
      }
    }
    const cacheable = this.checkIfCache(msg, noCache);
    if (cacheable) {
      if (
        this.messageCapacity !== 0 &&
        this.messages.length >= this.messageCapacity
      ) {
        this.messages.shift();
      }
      this.messages.push(msg as SpySocket.BroadcastEvent);
    }
  }

  public checkIfSend(msg: SpySocket.ClientEvent) {
    if (this.socketWrapper.getState() !== SocketState.OPEN) return false;
    if (
      [SERVER_MESSAGE_TYPE.UPDATE_ROOM_INFO, SERVER_MESSAGE_TYPE.PING].includes(
        msg.type,
      )
    ) {
      return true;
    }

    if (!this.debuggerConnection) return false;
    return true;
  }

  public checkIfCache(msg: SpySocket.ClientEvent, noCache: boolean = false) {
    if (this.isOffline || noCache) return false;
    if (
      [SERVER_MESSAGE_TYPE.MESSAGE, SERVER_MESSAGE_TYPE.PING].includes(msg.type)
    ) {
      return false;
    }
    return true;
  }

  public sendClientInfo() {
    const clientInfo = Client.makeClientInfoMsg();
    this.broadcastMessage(
      {
        role: 'client',
        type: 'client-info',
        data: clientInfo,
      },
      true,
    );
  }
}
