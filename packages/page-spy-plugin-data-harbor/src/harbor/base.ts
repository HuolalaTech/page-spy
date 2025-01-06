export type DataType =
  | 'console'
  | 'network'
  | 'system'
  | 'storage'
  | 'rrweb-event'
  | 'meta';

export interface CacheMessageItem {
  type: DataType;
  timestamp: number;
  data: string;
}

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
  startTime: number;
  endTime: number;
  remark?: string;
}

export const isPeriodAction = (
  action: string,
): action is 'download-periods' | 'upload-periods' => {
  return ['download-periods', 'upload-periods'].includes(action);
};

export const isPeriodActionParams = (
  params: unknown,
): params is PeriodActionParams => {
  if (!params) return false;
  return ['startTime', 'endTime'].every((key) => {
    return Object.prototype.hasOwnProperty.call(params, key);
  });
};

export interface PeriodItem {
  time: Date;
  stockIndex: number | null;
  dataIndex: number;
}

export const isPeriodItem = (data: unknown): data is PeriodItem => {
  if (!data) return false;
  return ['time', 'stockIndex', 'dataIndex'].every((key) => {
    return Object.prototype.hasOwnProperty.call(data, key);
  });
};
