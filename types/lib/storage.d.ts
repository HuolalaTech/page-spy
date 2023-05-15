export type DataType = 'local' | 'session' | 'cookie';
export type ActionType = 'clear' | 'remove' | 'get' | 'set';

type RestCookieInfo = {
  domain: null | string;
  path: string;
  partitioned: boolean;
  secure: boolean;
  sameSite: 'lax' | 'strict' | 'none';
  expires: null | number;
};
interface DataItem extends Partial<RestCookieInfo> {
  id: string;
  type: DataType;
  action: ActionType;
  name?: string;
  value?: string;
}
