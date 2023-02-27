import type { SpyMessage, SpySocket } from 'types';
import { getRandomId } from '.';

export const SERVER_MESSAGE_TYPE = {
  connect: 'connect',
  join: 'join',
  leave: 'leave',
  close: 'close',
  message: 'message',
  send: 'send',
  error: 'error',
} as const;

export const MESSAGE_TYPE = {
  /**
   * Just message
   */
  connect: 'connect',
  console: 'console',
  system: 'system',
  network: 'network',
  page: 'page',
  storage: 'storage',
  /**
   * Interactive: some type which sended by developer and need to reply something
   */
  debug: 'debug',
  refresh: 'refresh',
  'atom-detail': 'atom-detail',
  'atom-getter': 'atom-getter',
} as const;

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
    type: SERVER_MESSAGE_TYPE.send,
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
    type: SERVER_MESSAGE_TYPE.message,
    content: {
      data: msg,
    },
  };
}
