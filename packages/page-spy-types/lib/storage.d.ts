export type DataType =
  | 'localStorage'
  | 'sessionStorage'
  | 'cookie'
  | 'mpStorage' // mini program storage
  | 'asyncStorage'; // react native storage
export type ActionType = 'clear' | 'remove' | 'get' | 'set';

export type CookieStoreValue = {
  name: string;
  value: string;
  domain: null | string;
  path: string;
  partitioned: boolean;
  secure: boolean;
  sameSite: 'lax' | 'strict' | 'none';
  expires: null | number;
};

type Data = Pick<CookieStoreValue, 'name' | 'value'> &
  Partial<Omit<CookieStoreValue, 'name' | 'value'>>;

export interface GetTypeDataItem {
  type: DataType;
  action: 'get';
  data: Data[];
}

export interface SetTypeDataItem extends Data {
  type: DataType;
  action: 'set';
}

export interface RemoveTypeDataItem {
  type: DataType;
  action: 'remove';
  name: string;
}

export interface ClearTypeDataItem {
  type: DataType;
  action: 'clear';
}

export type TypeDataItem =
  | GetTypeDataItem
  | SetTypeDataItem
  | RemoveTypeDataItem
  | ClearTypeDataItem;

export type DataItem = TypeDataItem & {
  id: string;
};
