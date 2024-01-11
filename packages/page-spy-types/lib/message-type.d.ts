export type DataType =
  | 'connect'
  | 'console'
  | 'system'
  | 'network'
  | 'page'
  | 'storage'
  | 'database';

/**
 * Interactive: some type which sended by developer and need to reply something
 */
export type InteractiveType =
  | 'debug'
  | 'refresh'
  | 'atom-detail'
  | `atom-detail-${string}`
  | 'atom-getter'
  | `atom-getter-${string}`
  | 'debugger-online'
  | 'database-pagination';

export type MessageType = DataType | InteractiveType;

export interface MessageItem<T = MessageType, D = any> {
  role: 'client' | 'debugger';
  type: T;
  data: D;
}
