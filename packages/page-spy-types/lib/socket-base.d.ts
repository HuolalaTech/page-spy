import type { InteractiveType, MessageItem } from './message-type';

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

export interface SocketStoreType {
  // "noCache": should the message whether be cached in the SDK or not.
  // - true: don't cache the data like developer wouldn't care
  //         about the stale storage data.
  // - false: default value, cache the message like developer always cares
  //         the entire runtime log data
  broadcastMessage(message: MessageItem, noCache?: boolean): void;
  addListener(type: InteractiveType, fn: SocketEventCallback): void;
  dispatchEvent(type: InteractiveType, data: SocketEvent): void;
}
