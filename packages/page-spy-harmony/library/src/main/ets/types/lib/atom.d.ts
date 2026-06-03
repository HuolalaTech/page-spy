export interface Overview {
  id: string;
  type:
    | 'string'
    | 'number'
    | 'bigint'
    | 'boolean'
    | 'symbol'
    | 'undefined'
    | 'object'
    | 'function'
    | 'null'
    | 'error'
    | 'json'
    | 'debug-origin'
    | 'atom';
  value: any;
  __atomId?: string;
  instanceId?: string;
}
