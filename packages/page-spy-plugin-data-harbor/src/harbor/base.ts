import type { SpyMessage } from '@huolala-tech/page-spy-types';

export type DataType =
  | 'console'
  | 'network'
  | 'system'
  | 'storage'
  | 'rrweb-event';

export type Actions = 'download' | 'upload';

export type CacheMessageItem = Pick<
  SpyMessage.MessageItem<SpyMessage.DataType, any>,
  'type' | 'data'
> & {
  timestamp: number;
};
