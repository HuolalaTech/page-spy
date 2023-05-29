/* eslint-disable @typescript-eslint/no-redeclare */
/* eslint-disable vars-on-top */
/* eslint-disable no-var */
declare var Modernizr: any;
declare module '*.png' {
  const content: string;
  export default content;
}
declare module '*.svg' {
  const content: string;
  export default content;
}

interface CookieChangeEvent extends Event {
  changed: CookieStoreValue[];
  deleted: CookieStoreValue[];
}
type OptionName = {
  name: string;
  /**
   * @default false
   */
  partitioned?: boolean;
  path?: string;
  url?: string;
};
type CookieStoreValue = {
  name: string;
  value: string;
  domain: null | string;
  path: string;
  partitioned: boolean;
  secure: boolean;
  sameSite: 'lax' | 'strict' | 'none';
  expires: null | number;
};
interface CookieStore extends EventTarget {
  delete(name: OptionName | string): Promise<void>;
  get(name: OptionName | string): Promise<null | CookieStoreValue>;
  getAll(): Promise<CookieStoreValue[]>;
  set(name: string, value: string): Promise<void>;
  set(name: OptionName): Promise<void>;
}
declare var CookieStore: {
  prototype: CookieStore;
  new (): CookieStore;
};
declare var cookieStore: CookieStore;
