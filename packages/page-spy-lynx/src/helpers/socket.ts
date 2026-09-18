import {
  SocketStoreBase,
  SocketState,
  SocketWrapper,
  WebSocketEvents,
  stringifyData,
} from '@huolala-tech/page-spy-base';
import { getGlobal } from '../utils';

type NativeWebSocketEvent =
  | { type: 'open'; socketId: string }
  | { type: 'message'; socketId: string; data: string }
  | { type: 'close'; socketId: string; code?: number; reason?: string }
  | { type: 'error'; socketId: string; message?: string };

type NativeWebSocketDrainPayload =
  | NativeWebSocketEvent[]
  | { events?: NativeWebSocketEvent[] }
  | NativeWebSocketEvent
  | string
  | null
  | undefined;

type LynxNativeWebSocketModule = {
  connect(socketId: string, url: string): void;
  send(socketId: string, data: string): void;
  close(socketId: string): void;
  drainEvents(
    socketId: string,
    callback: (
      payload: NativeWebSocketDrainPayload,
      ...rest: NativeWebSocketDrainPayload[]
    ) => void,
  ): void;
};

/** 宿主侧需要注册的 Lynx 原生 WebSocket 模块名。 */
const NATIVE_MODULE_NAME = 'LynxNativeWebSocketModule';
const MISSING_NATIVE_MODULE_ERROR =
  'NativeModules.LynxNativeWebSocketModule or constructable globalThis.WebSocket is required for PageSpy websocket in Lynx runtime';

let socketIdSeed = 0;

/** 为每个原生 WebSocket 连接生成唯一 ID，便于轮询事件时区分连接。 */
const createSocketId = () => {
  socketIdSeed += 1;
  return `page-spy-lynx-ws-${Date.now()}-${socketIdSeed}`;
};

/** 获取宿主注入的原生 WebSocket 模块，并校验必要方法是否存在。 */
const getNativeWebSocketModule = (): LynxNativeWebSocketModule | null => {
  const nativeModule = getGlobal().NativeModules?.[NATIVE_MODULE_NAME];
  if (
    nativeModule &&
    typeof nativeModule.connect === 'function' &&
    typeof nativeModule.send === 'function' &&
    typeof nativeModule.close === 'function' &&
    typeof nativeModule.drainEvents === 'function'
  ) {
    return nativeModule;
  }
  return null;
};

/** 强制获取原生 WebSocket 模块，不存在时抛出统一错误。 */
const assertNativeWebSocketModule = () => {
  const nativeModule = getNativeWebSocketModule();
  if (!nativeModule) {
    throw Error(MISSING_NATIVE_MODULE_ERROR);
  }
  return nativeModule;
};

/** 判断 WebSocket 构造器是否可被 new，用于兼容非标准运行时对象。 */
const isConstructableWebSocket = (WebSocketCtor: any) => {
  if (typeof WebSocketCtor !== 'function') {
    return false;
  }
  try {
    Reflect.construct(String, [], WebSocketCtor);
    return true;
  } catch (e) {
    return false;
  }
};

/** 判断当前运行时是否提供可直接使用的 WebSocket。 */
const hasRuntimeWebSocket = () => {
  return isConstructableWebSocket(getGlobal().WebSocket);
};

/** 校验当前运行时至少存在原生模块或标准 WebSocket 能力。 */
const assertRuntimeWebSocket = () => {
  if (!getNativeWebSocketModule() && !hasRuntimeWebSocket()) {
    throw Error(MISSING_NATIVE_MODULE_ERROR);
  }
};

const NATIVE_EVENT_CONNECTING_POLL_INTERVAL = 50;
const NATIVE_EVENT_OPEN_POLL_INTERVAL = 250;
const ANDROID_OPEN_TERMINAL_GRACE_PERIOD = 1000;
const ANDROID_TERMINAL_CONFIRM_DELAY = 300;

/** 根据 Lynx 系统信息判断是否为 Android，用于处理 Android 早期终止事件抖动。 */
const isAndroidRuntime = () => {
  const globalObject = getGlobal();
  const platform = String(
    globalObject.SystemInfo?.platform ||
      globalObject.lynx?.__globalProps?.platform ||
      '',
  ).toLowerCase();

  return platform.includes('android');
};

/** 校验原生侧返回的数据是否为 WebSocket 事件。 */
const isNativeWebSocketEvent = (value: any): value is NativeWebSocketEvent => {
  return (
    value &&
    typeof value === 'object' &&
    typeof value.type === 'string' &&
    typeof value.socketId === 'string'
  );
};

/** 将原生模块可能返回的数组、对象、JSON 字符串等格式统一成事件数组。 */
const normalizeNativeEvents = (
  payload: NativeWebSocketDrainPayload,
  extraPayloads: NativeWebSocketDrainPayload[] = [],
) => {
  const allPayloads = [payload, ...extraPayloads];
  return allPayloads.reduce<NativeWebSocketEvent[]>((events, item) => {
    if (typeof item === 'string') {
      try {
        events.push(...normalizeNativeEvents(JSON.parse(item)));
      } catch (e) {
        // 忽略格式错误的原生 payload，继续轮询 socket 事件。
      }
      return events;
    }

    if (Array.isArray(item)) {
      events.push(...item.filter(isNativeWebSocketEvent));
      return events;
    }

    if (item && typeof item === 'object' && 'events' in item) {
      const wrappedEvents = item.events;
      if (Array.isArray(wrappedEvents)) {
        events.push(...wrappedEvents.filter(isNativeWebSocketEvent));
      }
      return events;
    }

    if (isNativeWebSocketEvent(item)) {
      events.push(item);
    }
    return events;
  }, [] as NativeWebSocketEvent[]);
};

/** 适配 PageSpy SocketWrapper，在 Lynx 中优先使用原生 WebSocket，必要时回退到全局 WebSocket。 */
export class LynxWebSocketWrapper extends SocketWrapper {
  /** 原生连接 ID；使用标准 WebSocket 时为空。 */
  public socketId: string | null = null;

  /** 标准 WebSocket 实例；使用原生模块时为空。 */
  public socketInstance: WebSocket | null = null;

  private readyState = SocketState.CLOSED;

  private nativeEventPollTimer: ReturnType<typeof setTimeout> | null = null;

  private nativeTerminalConfirmTimer: ReturnType<typeof setTimeout> | null =
    null;

  private nativeOpenedAt = 0;

  /** 初始化连接，优先走 NativeModules.LynxNativeWebSocketModule。 */
  init(url: string) {
    const nativeModule = getNativeWebSocketModule();
    if (!nativeModule) {
      this.initRuntimeWebSocket(url);
      return;
    }

    const socketId = createSocketId();

    this.socketId = socketId;
    this.socketInstance = null;
    this.readyState = SocketState.CONNECTING;
    nativeModule.connect(socketId, url);
    this.startNativeEventPolling();
  }

  /** 发送数据，自动区分标准 WebSocket 与原生模块通道。 */
  send(data: string) {
    if (this.socketInstance) {
      this.socketInstance.send(stringifyData(data));
      return;
    }

    if (!this.socketId || this.readyState !== SocketState.OPEN) return;

    assertNativeWebSocketModule().send(this.socketId, stringifyData(data));
  }

  /** 关闭当前连接，并更新内部 readyState。 */
  close() {
    if (this.socketInstance) {
      this.socketInstance.close();
      return;
    }

    if (!this.socketId || this.readyState === SocketState.CLOSED) return;

    this.readyState = SocketState.CLOSING;
    assertNativeWebSocketModule().close(this.socketId);
  }

  /** 获取当前连接状态，标准 WebSocket 直接读取实例 readyState。 */
  getState(): SocketState {
    if (this.socketInstance) {
      return this.socketInstance.readyState as SocketState;
    }

    return this.readyState;
  }

  /** 使用运行时自带 WebSocket 建立连接。 */
  private initRuntimeWebSocket(url: string) {
    this.clearNativeEventPolling();

    const WebSocketCtor = getGlobal().WebSocket;
    if (!isConstructableWebSocket(WebSocketCtor)) {
      throw Error(MISSING_NATIVE_MODULE_ERROR);
    }

    this.socketId = null;
    this.readyState = SocketState.CONNECTING;
    this.socketInstance = new WebSocketCtor(url);
    const eventNames: WebSocketEvents[] = ['open', 'close', 'error', 'message'];
    eventNames.forEach((eventName) => {
      // 将标准 WebSocket 事件转发到 SocketWrapper 的事件队列。
      this.socketInstance!.addEventListener(eventName, (data) => {
        if (eventName === 'open') {
          this.readyState = SocketState.OPEN;
        } else if (eventName === 'close' || eventName === 'error') {
          this.readyState = SocketState.CLOSED;
        }
        this.emit(eventName, data);
      });
    });
  }

  /** 启动原生事件轮询，连接中高频轮询，连接后降低轮询频率。 */
  private startNativeEventPolling() {
    this.clearNativeEventPolling();

    const poll = () => {
      if (!this.socketId || this.socketInstance) return;

      const { socketId } = this;
      assertNativeWebSocketModule().drainEvents(
        socketId,
        (payload, ...rest) => {
          const events = normalizeNativeEvents(payload, rest);
          events.forEach((event) => {
            this.handleNativeEvent(event);
          });

          if (
            this.socketId === socketId &&
            this.readyState !== SocketState.CLOSED
          ) {
            const interval =
              this.readyState === SocketState.OPEN
                ? NATIVE_EVENT_OPEN_POLL_INTERVAL
                : NATIVE_EVENT_CONNECTING_POLL_INTERVAL;
            this.nativeEventPollTimer = setTimeout(poll, interval);
          }
        },
      );
    };

    poll();
  }

  /** 清理原生事件轮询定时器。 */
  private clearNativeEventPolling() {
    if (this.nativeEventPollTimer) {
      clearTimeout(this.nativeEventPollTimer);
      this.nativeEventPollTimer = null;
    }
  }

  /** 清理 Android 终止事件确认定时器。 */
  private clearNativeTerminalConfirm() {
    if (this.nativeTerminalConfirmTimer) {
      clearTimeout(this.nativeTerminalConfirmTimer);
      this.nativeTerminalConfirmTimer = null;
    }
  }

  /** 处理原生 WebSocket 事件，并转成 SocketWrapper 标准事件。 */
  private handleNativeEvent(event: NativeWebSocketEvent) {
    if (!this.socketId || event.socketId !== this.socketId) return;

    if (event.type === 'open') {
      this.clearNativeTerminalConfirm();
      this.nativeOpenedAt = Date.now();
      this.readyState = SocketState.OPEN;
      this.emit('open', {});
      return;
    }

    if (event.type === 'message') {
      this.clearNativeTerminalConfirm();
      this.emit('message', { data: event.data });
      return;
    }

    if (event.type === 'close') {
      this.handleNativeTerminalEvent(event);
      return;
    }

    this.handleNativeTerminalEvent(event);
  }

  /** Android 刚 open 后可能立即上报误判终止事件，这里延迟确认一次。 */
  private handleNativeTerminalEvent(
    event: Extract<NativeWebSocketEvent, { type: 'close' | 'error' }>,
  ) {
    if (
      isAndroidRuntime() &&
      this.readyState === SocketState.OPEN &&
      (event.type === 'error' || event.code == null || event.code === 1000) &&
      Date.now() - this.nativeOpenedAt < ANDROID_OPEN_TERMINAL_GRACE_PERIOD
    ) {
      this.clearNativeTerminalConfirm();
      this.nativeTerminalConfirmTimer = setTimeout(() => {
        this.applyNativeTerminalEvent(event);
      }, ANDROID_TERMINAL_CONFIRM_DELAY);
      return;
    }

    this.applyNativeTerminalEvent(event);
  }

  /** 真正应用 close/error 终止事件并释放原生连接状态。 */
  private applyNativeTerminalEvent(
    event: Extract<NativeWebSocketEvent, { type: 'close' | 'error' }>,
  ) {
    this.readyState = SocketState.CLOSED;
    if (event.type === 'close') {
      this.emit('close', {
        code: event.code ?? 1000,
        reason: event.reason || '',
      });
    } else {
      this.emit('error', event.message || 'Native websocket error');
    }
    this.clearNativeEventPolling();
    this.clearNativeTerminalConfirm();
    this.socketId = null;
  }
}

/** PageSpy WebSocket Store 的 Lynx 版本，使用上方 wrapper 接管连接实现。 */
export class LynxWebSocketStore extends SocketStoreBase {
  // WebSocket 连接包装实例。
  protected socketWrapper: LynxWebSocketWrapper = new LynxWebSocketWrapper();

  // 父类抽象方法要求实例方法，这里保持空实现。
  // eslint-disable-next-line class-methods-use-this
  onOffline(): void {}

  // eslint-disable-next-line @typescript-eslint/no-useless-constructor
  constructor() {
    super();
  }

  /** 初始化前先确认当前 Lynx 运行时具备 WebSocket 能力。 */
  init(url: string): Promise<void> {
    assertRuntimeWebSocket();
    return super.init(url);
  }
}

const socketStore = new LynxWebSocketStore();

export default socketStore;
