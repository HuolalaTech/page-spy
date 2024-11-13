import type { SpyMessage } from '@huolala-tech/page-spy-types';
import { PeriodItem } from './blob';

export type DataType =
  | 'console'
  | 'network'
  | 'system'
  | 'storage'
  | 'rrweb-event';

export type Actions =
  | 'upload'
  | 'download'
  | 'upload-periods'
  | 'download-periods';

export interface WholeActionParams {
  clearCache?: boolean;
  remark?: string;
}
export interface PeriodActionParams {
  from: PeriodItem;
  to: PeriodItem;
  remark?: string;
}

export type CacheMessageItem = Pick<
  SpyMessage.MessageItem<SpyMessage.DataType, any>,
  'type' | 'data'
> & {
  timestamp: number;
};
