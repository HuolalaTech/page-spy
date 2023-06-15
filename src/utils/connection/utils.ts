import { SpyMessage, SpySocket } from 'types';

export interface SocketEvent<T = any> {
  source: {
    type: SpyMessage.MessageType;
    data: T;
  };
  from: SpySocket.Connection;
  to: SpySocket.Connection;
}
export type SocketEventCallback = (
  data: SocketEvent,
  reply: (data: any) => void,
) => void;
