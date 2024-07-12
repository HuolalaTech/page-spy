import type {
  DataType,
  InteractiveType,
  InternalMsgType,
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

export type EventType = InteractiveType | InternalMsgType;

export type EventCallback = InteractiveEventCallback | InternalEventCallback;
