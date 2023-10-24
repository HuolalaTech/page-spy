export interface DBStoreInfo<T = any> {
  name: string;
  keyPath: string | string[] | null;
  autoIncrement: boolean;
  indexes: string[];
  data: T;
}

export interface DBInfo {
  database: string;
  version?: number;
  stores: DBStoreInfo[];
}
