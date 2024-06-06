export type ProxyType = 'log' | 'info' | 'error' | 'warn' | 'debug';

export type DataType =
  | 'log'
  | 'info'
  | 'error'
  | 'warn'
  | 'debug'
  | 'debug-origin'
  | 'debug-eval';
export interface DataItem {
  id?: string;
  time?: number;
  url: string;
  logType: DataType;
  logs: any[];
  errorDetail?: {
    name: string;
    message: string;
    stack?: string;
  } | null;
}
