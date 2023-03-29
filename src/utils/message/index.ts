import type { SpyMessage, SpySocket } from 'types';
import { getRandomId } from '../index';
import * as SERVER_MESSAGE_TYPE from './server-type';

export * as DEBUG_MESSAGE_TYPE from './debug-type';

export function makeMessage(
  type: SpyMessage.MessageType,
  data: Record<string, any>,
  needId: boolean = true,
): SpyMessage.MessageItem {
  const result = {
    ...data,
  };
  if (needId) {
    result.id = getRandomId();
  }
  return {
    role: 'client',
    type,
    data: result,
  };
}

export function makeUnicastMessage(
  msg: SpyMessage.MessageItem,
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
  msg: SpyMessage.MessageItem,
): SpySocket.BrodcastEvent {
  return {
    type: SERVER_MESSAGE_TYPE.BROADCAST,
    content: {
      data: msg,
    },
  };
}
