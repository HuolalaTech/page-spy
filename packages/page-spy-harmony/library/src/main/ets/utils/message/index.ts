import type { SpyMessage, SpySocket } from '../../types';
import { getRandomId } from '../index';
import * as SERVER_MESSAGE_TYPE from './server-type';

export * as DEBUG_MESSAGE_TYPE from './debug-type';

export function makeMessage<
  T extends SpyMessage.MessageType,
  D extends Record<string, any>,
>(type: T, data: D, needId: boolean = true): SpyMessage.MessageItem<T, D> {
  const result = {
    ...(needId && { id: getRandomId() }),
    ...data,
  };
  return {
    role: 'client',
    type,
    data: result,
  };
}

export function makeUnicastMessage(
  msg: SpyMessage.MessageItem<SpyMessage.InteractiveType>,
  from: SpySocket.Connection,
  to: SpySocket.Connection,
): SpySocket.UnicastEvent {
  return {
    type: SERVER_MESSAGE_TYPE.MESSAGE,
    content: {
      data: msg,
      from,
      to,
    },
  };
}

export function makeBroadcastMessage(
  msg: SpyMessage.MessageItem<SpyMessage.DataType>,
): SpySocket.BroadcastEvent {
  return {
    type: SERVER_MESSAGE_TYPE.BROADCAST,
    content: {
      data: msg,
    },
  };
}
