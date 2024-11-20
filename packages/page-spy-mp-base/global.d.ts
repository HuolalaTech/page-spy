declare const PKG_VERSION: string;

type AppData = {
  globalData: Record<string, any>;
  __proto__: Object;
};

interface PageInfo {
  route: string;
  // page state data
  data: Record<string, any>;
  // page query string params
  options: Record<string, any>;

  setData: (data: Record<string, any>) => void;

  __proto__: Object;

  [other: string]: any;
}

declare function getCurrentPages<T extends PageInfo = PageInfo>(): T[];
declare function getApp(): AppData;

declare function Page(config: any): void; // TODO 补完
