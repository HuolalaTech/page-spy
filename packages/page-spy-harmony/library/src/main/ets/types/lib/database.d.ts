export interface DBStoreInfo {
  name: string;
  keyPath: string | string[] | null;
  autoIncrement: boolean;
  indexes: string[];
}

export interface DBInfo {
  name: string;
  version: number;
  stores: DBStoreInfo[];
}

interface BasicTypeDataItem {
  action: 'basic';
  result: DBInfo[] | null;
}

interface GetTypeDataItem<T = any> {
  action: 'get';
  database: Omit<DBInfo, 'stores'> | null;
  store: DBStoreInfo | null;
  page: {
    prev: number | null;
    current: number;
    next: number | null;
  };
  total: number;
  data: T;
}

interface DropTypeDataItem {
  // indexedDB.deleteDatabase()
  action: 'drop';
  database: string;
}

interface UpdateTypeDataItem {
  // store.put() || store.add() || store.delete()
  action: 'update';
  database: string;
  store: string;
}

interface ClearTypeDataItem {
  // store.clear()
  action: 'clear';
  database: string;
  store: string;
}

type TypeDataItem =
  | BasicTypeDataItem
  | GetTypeDataItem
  | DropTypeDataItem
  | UpdateTypeDataItem
  | ClearTypeDataItem;

export type DataItem = TypeDataItem & {
  id: string;
};
