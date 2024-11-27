/* eslint-disable @typescript-eslint/no-redeclare */
/* eslint-disable vars-on-top */
/* eslint-disable no-var */

import { CookieStoreValue } from '@huolala-tech/page-spy-types/lib/storage';

declare global {
  declare module '*.svg' {
    const content: string;
    export default content;
  }
  declare module '*.png' {
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

  interface CookieStoreEventTarget extends EventTarget {
    delete(name: OptionName | string): Promise<void>;
    get(name: OptionName | string): Promise<null | CookieStoreValue>;
    getAll(): Promise<CookieStoreValue[]>;
    set(name: string, value: string): Promise<void>;
    set(name: OptionName): Promise<void>;
  }

  var CookieStore: {
    prototype: CookieStoreEventTarget;
    new (): CookieStoreEventTarget;
  };

  var cookieStore: CookieStoreEventTarget;

  var Modernizr: any;
}
