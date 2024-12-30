import { InitConfigBase, OnInitParams } from '@huolala-tech/page-spy-types';

export interface AsyncCallback<R = void, E = any> {
  success?: (res: R) => void;
  fail?: (error: E) => void;
  complete?: (res?: R | E) => void;
  [other: string]: any;
}

export type KVList = {
  key: string;
  value: any;
}[];

export type SocketOnOpenHandler = (res: {
  header?: Record<string, string>;
}) => void;
export type SocketOnCloseHandler = (res: {
  code: number;
  reason: string;
}) => void;
export type SocketOnErrorHandler = (msg: string) => void;
export type SocketOnMessageHandler = (data: string | ArrayBuffer) => void;

export type MPSocket = {
  send(data: object): void;
  close(data: {}): void;
  onOpen(fun: SocketOnOpenHandler): void;
  onClose(fun: SocketOnCloseHandler): void;
  onError(fun: SocketOnErrorHandler): void;
  onMessage(fun: SocketOnMessageHandler): void;
};

export type FileSystemManager = {
  writeFileSync(
    filePath: string,
    data: string | ArrayBuffer,
    encoding?: string,
  ): void;
  writeFile(
    options: {
      filePath: string;
      data: string;
      encoding?: string;
    } & AsyncCallback,
  ): void;

  // alipay has different return type.. will be handled other where.
  readFileSync(filePath: string, encoding?: string): string | ArrayBuffer;
  readFile(
    options: {
      filePath: string;
      encoding?: string;
    } & AsyncCallback<string | ArrayBuffer>,
  ): void;

  unlink(
    options: {
      filePath: string;
    } & AsyncCallback,
  ): void;

  unlinkSync(filePath: string): void;
};

export type MPStorageAPI = {
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
  ): void;

  batchSetStorageSync(kvList: KVList): void;

  getStorage(
    params: {
      key: string;
    } & AsyncCallback<any>,
  ): void;

  getStorageSync(key: string): any;

  batchGetStorage(
    params: {
      keyList: string[];
    } & AsyncCallback,
  ): void;

  batchGetStorageSync(keyList: string[]): any[];

  removeStorage(
    params: {
      key: string;
    } & AsyncCallback,
  ): void;

  removeStorageSync(key: string | { key: string }): void;

  clearStorage(params: AsyncCallback): void;

  clearStorageSync(): void;
};

export type MPFileAPI = {
  getFileSystemManager(): FileSystemManager;
};

interface RequestParams<R>
  extends AsyncCallback<{
    data: R;
    statusCode: number;
    header?: Record<string, string>;
    cookies?: string[];
  }> {
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
}

export type MPNetworkAPI = {
  request<R>(params: RequestParams<R>): any;

  uploadFile(
    params: {
      url: string;
      filePath: string;
      name: string;
      header?: Record<string, string>;
      formData?: Record<string, any>;
      timeout?: number;

      responseType?: 'text' | 'arraybuffer';
      enableHttp2?: boolean;
    } & AsyncCallback<{
      data: any;
      statusCode: number;
    }>,
  ): void;

  connectSocket(
    params: {
      url: string;
      multiple?: boolean;
      header?: Record<string, string>;
    } & AsyncCallback,
  ): MPSocket | Promise<MPSocket>; // Taro will return a promise... wired

  onSocketOpen(handler: SocketOnOpenHandler): void;
  onSocketClose(handler: SocketOnCloseHandler): void;
  onSocketError(handler: SocketOnErrorHandler): void;
  onSocketMessage(handler: SocketOnMessageHandler): void;
  sendSocketMessage(
    params: { data: string | ArrayBuffer } & AsyncCallback,
  ): void;
  closeSocket(params: AsyncCallback): void;
};

export type MPSystemAPI = {
  // for test purpose
  env: {
    USER_DATA_PATH: string;
  };
  trigger(name: string, data?: any): void;
  canIUse(schema: string): boolean;
  getSystemInfoSync(): {
    app?: string;
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
    [others: string]: any;
  };
  onError(listener: (res: { message: string; stack: string }) => void): void;
  offError(listener: (res: { message: string; stack: string }) => void): void;
  onUnhandledRejection(listener: (res: { reason: string }) => void): void;
  offUnhandledRejection(listener: (res: { reason: string }) => void): void;
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
    miniProgram: {
      appId: string;
      envVersion: 'develop' | 'trial' | 'release';
      version: string;
    };
  };

  // getSetting(params:  AsyncCallback<AuthSetting>): void

  // available in high version, need to check before using
  getAppAuthorizeSetting(): Record<string, string>;

  // available in high version, need to check before using
  getSystemSetting(): Record<string, unknown>;

  getSetting(
    options: AsyncCallback<{ authSetting: Record<string, boolean> }>,
  ): void;

  setClipboardData(
    options: {
      data: string;
    } & AsyncCallback,
  ): void;
};

export type MPUIAPI = {
  showActionSheet(
    options: {
      alertText?: string; // for wx
      title?: string;
      itemList: string[];
      itemColor?: string;
    } & AsyncCallback<{
      tapIndex: number;
    }>,
  ): void;
  showToast(
    options: {
      title: string;
      icon?: 'none' | 'success' | 'loading' | 'error';
      duration?: number;
    } & AsyncCallback,
  ): void;
  hideToast(): void;
  showLoading(
    options: {
      title: string;
      duration?: number;
    } & AsyncCallback,
  ): void;
  hideLoading(): void;
  showModal(
    options: {
      title?: string;
      content?: string;
      showCancel?: boolean;
      confirmText?: string;
      confirmColor?: string;
      cancelText?: string;
      cancelColor?: string;
    } & AsyncCallback<{
      confirm?: boolean;
      cancel?: boolean;
    }>,
  ): void;
};

export type MPRouterAPI = {
  switchTab(params: { url: string } & AsyncCallback): void;
  reLaunch(params: { url: string } & AsyncCallback): void;
  redirectTo(params: { url: string } & AsyncCallback): void;
  navigateTo(params: { url: string } & AsyncCallback): void;
  navigateBack(params: { delta?: number } & AsyncCallback): void;
};

export type MPSDK = MPUIAPI &
  MPStorageAPI &
  MPFileAPI &
  MPNetworkAPI &
  MPSystemAPI &
  MPRouterAPI;

export interface MPPluginInitParams<T extends InitConfigBase>
  extends OnInitParams<T> {
  mp: MPSDK;
}
