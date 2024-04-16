import type {
  DataType,
  InteractiveType,
  InternalType,
  MessageItem,
} from './message-type';
import { Connection } from './socket-event';

export interface InteractiveEvent<T = any> {
  source: MessageItem<InteractiveType, T>;
  from: Connection;
  to: Connection;
}

export type InteractiveEventCallback = (
  data: InteractiveEvent,
  reply: (data: any) => void,
) => void;

export type InternalEventCallback = (data: MessageItem<DataType>) => void;

export type EventType = InteractiveType | InternalType;

export type EventCallback = InteractiveEventCallback | InternalEventCallback;

export interface SocketStoreType {
  // "noCache": should the message whether be cached in the SDK or not.
  // - true: don't cache the data like developer wouldn't care
  //         about the stale storage data.
  // - false: default value, cache the message like developer always cares
  //         the entire runtime log data
  broadcastMessage(message: MessageItem, noCache?: boolean): void;

  addListener(type: InteractiveType, fn: InteractiveEventCallback): void;
  addListener(type: InternalType, fn: InternalEventCallback): void;

  dispatchEvent(type: InteractiveType, data: InteractiveEvent): void;
  dispatchEvent(type: InternalType, data: any): void;
}
