export type DataType =
  | 'localStorage'
  | 'sessionStorage'
  | 'cookie'
  | 'mpStorage';
export type ActionType = 'clear' | 'remove' | 'get' | 'set';

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
