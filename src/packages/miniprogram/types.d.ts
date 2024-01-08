declare const PKG_VERSION: string;

type AsyncCallback<R = any, E = any> = {
  success?: (res?: R) => void;
  fail?: (error?: E) => void;
  complete?: (res?: R | E) => void;
};

type KVList = {
  key: string;
  value: any;
}[];

declare type MPWeixinSocket = {
  send(data: object): void;
  close(data: {}): void;
  onOpen(fun: (res: { header?: Record<string, string> }) => void): void;
  onClose(fun: (res: { code: number; reason: string }) => void): void;
  onError(fun: (msg: string) => void): void;
  onMessage(fun: (data: string | ArrayBuffer) => void): void;
};

type StorageParams = {
  key: string;
  data: any;
  encrypt?: boolean;
  succe;
};

declare type WXStorageAPI = {
  getStorageInfoSync(): {
    keys: string[];
    currentSize: number;
    limitSize: number;
  };

  setStorage(
    params: {
      key: string;
      data: any;
    } & AsyncCallback,
  ): void;

  setStorageSync(key: string, data: any): void;

  batchSetStorage(
    params: {
      kvList: KVList;
    } & AsyncCallback,
  );

  batchSetStorageSync(kvList);

  getStorage(
    params: {
      key: string;
    } & AsyncCallback,
  );

  getStorageSync(key: string);

  batchGetStorage(
    params: {
      keyList: string[];
    } & AsyncCallback,
  );

  batchGetStorageSync(keyList: string[]);

  removeStorage(
    params: {
      key: string;
    } & AsyncCallback,
  );

  removeStorageSync(key: string);

  clearStorage(params: AsyncCallback);

  clearStorageSync();
};

type WXNetworkAPI = {
  request(
    params: {
      url: string;
      data?: string | object | ArrayBuffer;
      header?: Record<string, string>;
      timeout?: number;
      method?:
        | 'GET'
        | 'POST'
        | 'PUT'
        | 'DELETE'
        | 'HEAD'
        | 'OPTIONS'
        | 'TRACE'
        | 'CONNECT';
      dataType?: 'json';
      responseType?: 'text' | 'arraybuffer';
      enableHttp2?: boolean;
      enableQuic?: boolean;
      enableCache?: boolean;

      // TODO
    } & AsyncCallback<{
      data: any;
      statusCode: number;
      header?: Record<string, string>;
      cookies?: string[];
    }>,
  ): any;

  connectSocket(params: {
    url: string;
    header?: Record<string, string>;
  }): MPWeixinSocket;
};

type WXSystemAPI = {
  // for test purpose
  trigger(name: string, data?: any): void;
  canIUse(schema: string): boolean;
  getSystemInfoSync(): {
    brand?: string;
    // model: string;
    // pixelRatio: number;
    screenWidth?: number;
    screenHeight?: number;
    // windowWidth: number;
    // windowHeight: number;
    statusBarHeight?: number;
    // language: string;
    version: string;
    system: string;
    platform: 'ios' | 'android' | 'windows' | 'mac' | 'devtools';
    SDKVersion?: string;
  };
  onError(listener: (res: { message: string; stack: string }) => void);
  onUnHandledRejection(listener: (res: { reason: string }) => void);
  onAppShow(
    listener: (res: {
      path: string;
      scene: number;
      query: Object;
      shareTicket?: string;
      referrerInfo?: {
        appId: string;
        extraData: string;
      };
      forwardMaterials?: {
        type: string;
        name: string;
        path: string;
        size: number;
      }[];
      chatType: 1 | 2 | 3 | 4;
      apiCategory:
        | 'default'
        | 'nativeFunctionalized'
        | 'browseOnly'
        | 'embedded';
    }) => void,
  ): void;
  // onAppHide(listener: () => void): void;
  offAppShow(listener: () => void): void;
  // offAppHide(listener: () => void): void;
  // onPageNotFound(
  //   listener: (res: {
  //     path: string;
  //     query: Object;
  //     isEntryPage: boolean;
  //   }) => void,
  // );
  // onLazyLoadError(
  //   listener: (res: {
  //     type: string;
  //     subpackage: any[];
  //     errMsg: string;
  //   }) => void,
  // );
  getAccountInfoSync(): {
    appId: string;
    envVersion: 'develop' | 'trial' | 'release';
    version: string;
  };
};

declare const wx: WXStorageAPI & WXNetworkAPI & WXSystemAPI;

type PageInfo = {
  route: string;
  // page state data
  data: Record<string, any>;
  // page query string params
  options: Record<string, any>;
};
declare function getCurrentPages(): PageInfo[];
