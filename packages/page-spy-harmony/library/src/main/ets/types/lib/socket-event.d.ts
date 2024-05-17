import type { DataType, InteractiveType, MessageItem } from './message-type';

export type EventType =
  | 'connect'
  | 'join'
  | 'leave'
  | 'close'
  | 'broadcast'
  | 'message'
  | 'error'
  | 'ping'
  | 'pong'
  | 'updateRoomInfo';

export interface Connection {
  address: string;
  userId: string;
  name: string;
}

interface EventConstructor<T extends EventType, C extends any> {
  type: T;
  content: C;
}

export type JoinEvent = EventConstructor<
  'join',
  {
    connection: Connection;
  }
>;
export type ConnectEvent = EventConstructor<
  'connect',
  {
    selfConnection: Connection;
    roomConnections: Connection[];
  }
>;
export type LeaveEvent = EventConstructor<
  'leave',
  {
    connection: Connection;
  }
>;
export type CloseEvent = EventConstructor<
  'close',
  {
    roomAddress: string;
    reason: string;
  }
>;
export type BroadcastEvent = EventConstructor<
  'broadcast',
  {
    data: MessageItem<DataType>;
  }
>;
export type UnicastEvent = EventConstructor<
  'message',
  {
    data: MessageItem<InteractiveType>;
    from: Connection;
    to: Connection;
  }
>;
export type ErrorEvent = EventConstructor<
  'error',
  {
    code: string;
    message: string;
  }
>;
export type PingEvent = EventConstructor<'ping', any>;
export type PongEvent = EventConstructor<'pong', any>;
export type UpdateRoomInfoEvent = EventConstructor<
  'updateRoomInfo',
  {
    info: {
      name?: string;
      group?: string;
      tags?: Record<string, any>;
    };
  }
>;
export type ClientEvent =
  | UnicastEvent
  | BroadcastEvent
  | PingEvent
  | UpdateRoomInfoEvent;
export type Event =
  | JoinEvent
  | ConnectEvent
  | LeaveEvent
  | CloseEvent
  | BroadcastEvent
  | UnicastEvent
  | ErrorEvent
  | PingEvent
  | PongEvent
  | UpdateRoomInfoEvent;

export type PackedEvent = Event & {
  createdAt: number;
  requestId: string;
};
