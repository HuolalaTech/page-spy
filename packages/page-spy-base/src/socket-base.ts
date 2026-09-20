/**
 * socket base class
 * 不同平台 socket 的 api 不同但功能相同，这里抽象一层
 */

import { SpyMessage, SpySocket, SpyBase } from '@huolala-tech/page-spy-types';
import { PackedEvent } from '@huolala-tech/page-spy-types/lib/socket-event';
import { getRandomId, psLog, stringifyData } from './utils';
import {
  makeMessage,
  makeBroadcastMessage,
  makeUnicastMessage,
} from './message';
import * as SERVER_MESSAGE_TYPE from './message/server-type';
import { atom } from './atom';
import { Client } from './client';
import { InitConfigBase } from './config';
import { SOCKET_CONFIG } from './constants';

type InteractiveType = SpyMessage.InteractiveType;
type InternalMsgType = SpyMessage.InternalMsgType;
interface GetterMember {
  key: string; // 属性名
  id: string; // 当前键的 id
  parentId: string; // 当前属性所在容器的 id
  instanceId: string; // 当前实例的 id
}

/** Platform-neutral event payload emitted by socket wrappers. */
export interface SocketMessageEvent {
  data: unknown;
}

export interface SocketEventPayloadMap {
  open: { header?: Record<string, string> };
  close: { code: number; reason: string };
  error: unknown;
  message: SocketMessageEvent;
}

export type WebSocketEvents = keyof SocketEventPayloadMap;
type SocketEventListeners = {
  [Event in WebSocketEvents]: Array<
    (data: SocketEventPayloadMap[Event]) => void
  >;
};

// fork WebSocket state
export enum SocketState {
  CONNECTING = 0,
  OPEN = 1,
  CLOSING = 2,
  CLOSED = 3,
}

// Caps exponential backoff after SOCKET_CONFIG.MAX_RETRY_ATTEMPTS increases.
const MAX_RETRY_INTERVAL =
  Math.pow(
    SOCKET_CONFIG.RETRY_INTERVAL_MULTIPLIER,
    SOCKET_CONFIG.MAX_RETRY_ATTEMPTS,
  ) * SOCKET_CONFIG.INITIAL_RETRY_INTERVAL_MS;

// 封装不同平台的 socket
export abstract class SocketWrapper {
  abstract init(url: string): void;
  abstract send(data: string): void;
  abstract close(data?: {}): void;
  abstract getState(): SocketState;
  events: SocketEventListeners = {
    open: [],
    close: [],
    error: [],
    message: [],
  };

  protected emit<Event extends WebSocketEvents>(
    event: Event,
    data: SocketEventPayloadMap[Event],
  ) {
    this.events[event].forEach((fun) => {
      fun(data);
    });
    // for close and error, clear all listeners or they will be called on next socket instance.
    if (event === 'close' || event === 'error') {
      this.clearListeners();
    }
  }

  onOpen(fun: (res: SocketEventPayloadMap['open']) => void) {
    this.events.open.push(fun);
  }

  onClose(fun: (res: SocketEventPayloadMap['close']) => void) {
    this.events.close.push(fun);
  }

  onError(fun: (error: SocketEventPayloadMap['error']) => void) {
    this.events.error.push(fun);
  }

  onMessage(fun: (event: SocketEventPayloadMap['message']) => void) {
    this.events.message.push(fun);
  }

  clearListeners() {
    // clear listeners
    Object.entries(this.events).forEach(([, funs]) => {
      funs.splice(0);
    });
  }
}

export abstract class SocketStoreBase implements SpyBase.SocketStoreType {
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

  // Maximum message buffer size (0 = unlimited).
  // When limit is reached, oldest messages are evicted using a sliding window approach.
  public messageCapacity: number = 0;

  // Message buffer implementing FIFO eviction
  public messages: SpySocket.BroadcastEvent[] = [];

  // Index of the first valid message (avoids O(n) array shifts on every eviction)
  protected messageHead: number = 0;

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
    'harbor-clear': [],
  };

  // Starts at the configured delay and increases with exponential backoff.
  public retryInterval = SOCKET_CONFIG.INITIAL_RETRY_INTERVAL_MS;

  public connectable = true;

  protected abstract socketWrapper: SocketWrapper;

  public getSocket() {
    return this.socketWrapper;
  }

  public getPageSpyConfig: (() => Required<InitConfigBase>) | null = null;

  public getClient: (() => Client) | null = null;

  updateRoomInfo() {
    if (this.getPageSpyConfig) {
      const { project, title } = this.getPageSpyConfig();
      const name = this.getClient?.().getName();
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
  public static messageFilters: Array<(data: SocketMessageEvent) => unknown> =
    [];

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
      this.socketWrapper?.onOpen(() => {
        this.connectOnline();
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
    } catch (e: unknown) {
      psLog.error(e instanceof Error ? e.message : String(e));
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
  public addListener(
    type: InteractiveType | InternalMsgType,
    fn: SpyBase.EventCallback,
  ) {
    /* c8 ignore next 3 */
    if (!this.events[type]) {
      this.events[type] = [];
    }
    this.events[type].push(fn);
  }

  public removeListener(
    type: SpyMessage.InteractiveType,
    fn: SpyBase.InteractiveEventCallback,
  ): void;
  public removeListener(
    type: InternalMsgType,
    fn: SpyBase.InternalEventCallback,
  ): void;
  public removeListener(
    type: InteractiveType | InternalMsgType,
    fn: SpyBase.EventCallback,
  ) {
    /* c8 ignore next 3 */
    const fns = this.events[type] || [];
    const index = fns.indexOf(fn);
    if (index > -1) {
      fns.splice(index, 1);
    }
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
    if (this.retryTimer) {
      clearTimeout(this.retryTimer);
      this.retryTimer = null;
    }
    this.socketWrapper?.close();
    this.messages = [];
    this.messageHead = 0;
    Object.entries(this.events).forEach(([evt, fns]) => {
      // 这三个事件的生命周期跟随 socketStore
      if (['atom-detail', 'atom-getter', 'debugger-online'].includes(evt)) {
        return;
      }
      fns.splice(0);
    });
  }

  public connectOnline() {
    this.retryInterval = SOCKET_CONFIG.INITIAL_RETRY_INTERVAL_MS;
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
        this.retryInterval *= SOCKET_CONFIG.RETRY_INTERVAL_MULTIPLIER;
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
    /* c8 ignore start */
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
      }, SOCKET_CONFIG.HEARTBEAT_INTERVAL_MS);
    }, SOCKET_CONFIG.HEARTBEAT_INTERVAL_MS);
    /* c8 ignore stop */
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
    if (this.pongTimer) {
      clearTimeout(this.pongTimer);
      this.pongTimer = null;
    }
    this.ping();
  }

  // get the data which we expected from nested structure of the message
  protected handleMessage(evt: SocketMessageEvent) {
    const filteredEvent = SocketStoreBase.messageFilters.reduce<unknown>(
      (currentEvent, filter) => {
        if (!SocketStoreBase.isSocketMessageEvent(currentEvent)) {
          return currentEvent;
        }
        return filter(currentEvent);
      },
      evt,
    );
    if (!SocketStoreBase.isSocketMessageEvent(filteredEvent)) {
      psLog.warn('Failed to parse message, invalid message event received.');
      return;
    }
    const { data: rawData } = filteredEvent;
    if (typeof rawData !== 'string') {
      psLog.warn('Failed to parse message, expected string data.');
      return;
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
    let result: SpySocket.Event;
    try {
      result = JSON.parse(rawData) as SpySocket.Event;
    } catch (e) {
      psLog.warn('Failed to parse message, malformed data received.');
      return;
    }
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
            // once connected, send client info
            this.sendClientInfo();
          } else {
            this.debuggerConnection = null;
          }
        }
        break;
      case MESSAGE:
        const { data, from, to } = result.content;
        if (
          to.address === this.socketConnection?.address &&
          SocketStoreBase.isInteractiveType(data.type)
        ) {
          this.dispatchEvent(data.type, {
            source: data as SpyMessage.MessageItem<InteractiveType>,
            from,
            to,
          });
        }
        break;
      case CLOSE:
      case ERROR:
        this.connectOffline();
        break;
      /* c8 ignore start */
      case PONG:
      case PING:
      case BROADCAST:
      default:
        // noting
        break;
      /* c8 ignore stop */
    }
    // whatever the type is, we should handle pong
    this.handlePong();
  }

  public dispatchEvent(
    type: SpyMessage.InteractiveType,
    data: SpyBase.InteractiveEvent,
  ): void;
  public dispatchEvent(
    type: 'public-data',
    data: SpyMessage.MessageItem<SpyMessage.DataType>,
  ): void;
  public dispatchEvent(type: 'harbor-clear', data: null): void;
  public dispatchEvent(
    type: InteractiveType | InternalMsgType,
    data:
      | SpyBase.InteractiveEvent
      | SpyMessage.MessageItem<SpyMessage.DataType>
      | null,
  ) {
    if (['public-data'].includes(type)) {
      this.events['public-data'].forEach((fn) => {
        (fn as SpyBase.InternalEventCallback)(
          data as SpyMessage.MessageItem<SpyMessage.DataType>,
        );
      });
      return;
    }
    this.events[type]?.forEach((fn) => {
      (fn as SpyBase.InteractiveEventCallback).call(
        this,
        data as SpyBase.InteractiveEvent,
        (d: SpyMessage.MessageItem<SpyMessage.InteractiveType>) => {
          this.unicastMessage(d, (data as SpyBase.InteractiveEvent).from);
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
      (i, idx) =>
        idx >= this.messageHead && i.content.data.data.id === latestId,
    );

    /* c8 ignore start */
    this.messages.slice(msgIndex + 1).forEach((msg) => {
      const data: SpySocket.UnicastEvent = {
        type: SERVER_MESSAGE_TYPE.MESSAGE,
        content: {
          data: msg.content.data,
          from: this.socketConnection!,
          to: message.from,
        },
      };
      this.send(data, true);
    });
    /* c8 ignore stop */
  }

  public static handleResolveAtom(
    { source }: SpyBase.InteractiveEvent<string>,
    reply: (data: SpyMessage.MessageItem) => void,
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
    reply: (data: SpyMessage.MessageItem) => void,
  ) {
    const { type, data } = source;
    if (type === 'atom-getter') {
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

  protected send(msg: SpySocket.ClientEvent, noCache: boolean = false) {
    const sendable = this.checkIfSend(msg);
    if (sendable) {
      /* c8 ignore start */
      try {
        const pkMsg = msg as PackedEvent;
        pkMsg.createdAt = Date.now();
        pkMsg.requestId = getRandomId();
        const dataString = stringifyData(pkMsg);
        this.socketWrapper?.send(dataString);
      } catch (e: unknown) {
        psLog.error(
          `Incompatible: ${e instanceof Error ? e.message : String(e)}`,
        );
        this.connectOffline();
      }
      /* c8 ignore stop */
    }
    const cacheable = this.checkIfCache(msg, noCache);
    if (cacheable) {
      // FIFO eviction: when buffer is full, advance the head pointer
      if (
        this.messageCapacity !== 0 &&
        this.messages.length - this.messageHead >= this.messageCapacity
      ) {
        this.messageHead += 1;
        // Compact the array periodically to prevent unbounded growth
        // Once half the array is unused, slice it off
        if (this.messageHead > this.messageCapacity) {
          this.messages = this.messages.slice(this.messageHead);
          this.messageHead = 0;
        }
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
    const clientInfo = this.getClient?.().makeClientInfoMsg();
    this.broadcastMessage(
      {
        role: 'client',
        type: 'client-info',
        data: clientInfo,
      },
      true,
    );
  }

  private static isSocketMessageEvent(
    value: unknown,
  ): value is SocketMessageEvent {
    return typeof value === 'object' && value !== null && 'data' in value;
  }

  private static isInteractiveType(
    type: SpyMessage.MessageType,
  ): type is InteractiveType {
    return (
      type === 'debug' ||
      type === 'refresh' ||
      type === 'atom-detail' ||
      type.startsWith('atom-detail-') ||
      type === 'atom-getter' ||
      type.startsWith('atom-getter-') ||
      type === 'debugger-online' ||
      type === 'database-pagination'
    );
  }
}
