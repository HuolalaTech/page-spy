import { SocketState } from 'page-spy-base/src';
import { mockRequest } from './request';
import EventEmitter from 'events';
import {
  AsyncCallback,
  FileSystemManager,
  KVList,
  MPFileAPI,
  MPNetworkAPI,
  MPRouterAPI,
  MPStorageAPI,
  MPSystemAPI,
  MPUIAPI,
  SocketOnCloseHandler,
  SocketOnErrorHandler,
  SocketOnMessageHandler,
  SocketOnOpenHandler,
} from 'page-spy-mp-base/src/types';
type CBType = (event?: any) => any;

export class MockSocket {
  private ee = new EventEmitter();
  status: SocketState = SocketState.CONNECTING;
  send(params: { data: string | ArrayBuffer }) {}
  onOpen(handler: (res: any) => void) {
    this.status = SocketState.OPEN;
    this.ee.addListener('open', handler);
  }
  onClose(handler: (res: any) => void) {
    this.ee.addListener('close', handler);
  }
  onError(handler: (msg: string) => void) {
    this.ee.addListener('error', handler);
  }
  onMessage(handler: (data: string | ArrayBuffer) => void) {
    this.ee.addListener('message', handler);
  }
  close() {
    if (this.status !== SocketState.CLOSED) {
      return;
    }
    this.status = SocketState.CLOSED;
    this.ee.emit('close');
  }
}

export const mockMP: () => MPSystemAPI &
  MPNetworkAPI &
  MPStorageAPI &
  MPRouterAPI &
  MPUIAPI &
  MPFileAPI = () => {
  let store: Record<string, any> = {};
  let socketInstance: MockSocket | null = null;
  const listeners = new Map<string, CBType[]>();
  listeners.set('onError', []);
  listeners.set('onUnhandledRejection', []);
  listeners.set('onAppShow', []);
  const api = {
    env: { USER_DATA_PATH: '' },

    trigger(name: string, data?: any) {
      listeners.get(name)?.forEach((cb) => cb(data));
    },
    off(name: string, cb: CBType) {
      listeners.get(name)?.splice(listeners.get(name)?.indexOf(cb) || 0, 1);
    },

    setClipboardData(options: { data: string } & AsyncCallback): void {
      options.success?.();
      options.complete?.();
    },

    showActionSheet(params: any) {},

    showToast(params: any) {},

    hideToast() {},

    showLoading(params: any) {},

    hideLoading() {},

    showModal(params: Parameters<MPUIAPI['showModal']>[0]) {
      params.success?.({ confirm: true, cancel: false });
    },

    setStorage(params: { key: string; data: any } & AsyncCallback) {
      store[params.key] = params.data;
      params.success && params.success();
    },
    getStorage(params: { key: string } & AsyncCallback) {
      params.success && params.success(store[params.key]);
    },
    removeStorage(params: { key: string } & AsyncCallback) {
      delete store[params.key];
      params.success && params.success();
    },

    clearStorage(params: {} & AsyncCallback) {
      store = {};
      params.success?.();
    },

    // getStorageInfo(params: { } & AsyncCallback) {
    //   params.success && params.success({
    //     keys: Object.keys(store),
    //     currentSize: 0,
    //     limitSize: 0,
    //   })
    // },
    getStorageSync(key: string) {
      return store[key];
    },
    clearStorageSync() {
      store = {};
    },
    setStorageSync(key: string, data: any) {
      store[key] = data;
    },

    getStorageInfoSync() {
      return {
        keys: Object.keys(store),
        currentSize: 0,
        limitSize: 0,
      };
    },
    removeStorageSync(key: string) {
      delete store[key];
    },
    // getStorageKeys(params: { } & AsyncCallback<any, any>) {
    //   params.success && params.success(Object.keys(store))
    // },
    // getStorageKeysSync() {
    //   return Object.keys(store)
    // },
    batchGetStorage(params: { keyList: string[] } & AsyncCallback<any, any>) {
      params.success && params.success(params.keyList.map((key) => store[key]));
    },
    batchGetStorageSync(keyList: string[]) {
      return keyList.map((key) => store[key]);
    },
    batchSetStorage(params: { kvList: KVList } & AsyncCallback) {
      params.kvList.forEach((kv) => {
        store[kv.key] = kv.value;
      });
      params.success && params.success();
    },
    batchSetStorageSync(kvList: KVList) {
      kvList.forEach((kv) => {
        store[kv.key] = kv.value;
      });
    },

    request: mockRequest,

    connectSocket(params: Parameters<MPNetworkAPI['connectSocket']>[0]) {
      // let closeHandler: (res: any) => void;
      // let openHandler: (res: any) => void;
      // let messageHandler: (data: object) => void;
      // let errorHandler: (msg: string) => void;
      // let status: SocketState = SocketState.OPEN;
      socketInstance = new MockSocket();
      return socketInstance;
      // return {
      //   send(data: object) {},
      //   onOpen(handler: (res: any) => void) {
      //     status = SocketState.OPEN;
      //     openHandler = handler;
      //   },
      //   onClose(handler: (res: any) => void) {
      //     closeHandler = handler;
      //   },
      //   onError(handler: (msg: string) => void) {
      //     errorHandler = handler;
      //   },
      //   close() {
      //     if (status !== SocketState.CLOSED) {
      //       return;
      //     }
      //     status = SocketState.CLOSED;
      //     if (closeHandler) {
      //       closeHandler({});
      //     }
      //   },
      //   onMessage(handler: (data: object) => void) {
      //     messageHandler = handler;
      //   },
      // } as MPSocket;
    },

    onSocketClose(handler: SocketOnCloseHandler): void {
      socketInstance?.onClose(handler);
    },
    onSocketError(handler: SocketOnErrorHandler): void {
      socketInstance?.onError(handler);
    },
    onSocketMessage(handler: SocketOnMessageHandler): void {
      socketInstance?.onMessage(handler);
    },
    onSocketOpen(handler: SocketOnOpenHandler): void {
      socketInstance?.onOpen(handler);
    },
    sendSocketMessage(
      params: { data: string | ArrayBuffer } & AsyncCallback<any, any>,
    ): void {
      socketInstance?.send(params);
    },
    closeSocket(params: AsyncCallback<any, any>): void {
      socketInstance?.close();
    },

    uploadFile(params: Parameters<MPNetworkAPI['uploadFile']>[0]) {
      const res = {
        statusCode: 200,
        header: {
          'content-type': 'application/json',
        },
        data: { text: 'Hello PageSpy' },
      };
      params.success?.(res);
      params.complete?.(res);
    },

    getFileSystemManager(): FileSystemManager {
      return {
        writeFile(params: Parameters<FileSystemManager['writeFile']>[0]) {
          params.success?.();
        },

        writeFileSync(
          params: Parameters<FileSystemManager['writeFileSync']>[0],
        ) {
          return '';
        },
        readFile(params: Parameters<FileSystemManager['readFile']>[0]) {
          params.success?.('');
        },
        readFileSync(filePath: string, encoding?: string) {
          return '';
        },
        unlink(params: Parameters<FileSystemManager['unlink']>[0]) {
          params.success?.();
        },
        unlinkSync(filePath: string) {},
      };
    },

    canIUse(api: string) {
      return true;
    },

    getSystemInfoSync() {
      return {
        platform: 'devtools',
        version: '1.0.0',
        system: 'iOS 14.0.1',
      } as ReturnType<MPSystemAPI['getSystemInfoSync']>;
    },

    getAppAuthorizeSetting() {
      return {};
    },

    getSystemSetting() {
      return {};
    },
    getSetting() {},

    onError(cb: CBType) {
      listeners.get('onError')?.push(cb);
    },
    offError(cb: CBType) {
      this.off('onError', cb);
    },
    onUnhandledRejection(cb: CBType) {
      listeners.get('onUnhandledRejection')?.push(cb);
    },
    offUnhandledRejection(cb: CBType) {
      this.off('onUnhandledRejection', cb);
    },
    onAppShow(cb: CBType) {
      listeners.get('onAppShow')?.push(cb);
    },
    offAppShow(listener: () => void): void {
      this.off('onAppShow', listener);
    },
    getAccountInfoSync(): {
      miniProgram: {
        appId: string;
        envVersion: 'develop' | 'trial' | 'release';
        version: string;
      };
    } {
      return {
        miniProgram: {
          appId: 'wx1234567890abcdef',
          envVersion: 'develop',
          version: '1.0.0',
        },
      };
    },

    // router
    switchTab(params: { url: string } & AsyncCallback) {
      params.success && params.success();
    },
    redirectTo(params: { url: string } & AsyncCallback) {
      params.success && params.success();
    },
    navigateTo(params: { url: string } & AsyncCallback) {
      params.success && params.success();
    },
    navigateBack(params: { delta?: number } & AsyncCallback) {
      params.success && params.success();
    },
    reLaunch(params: { url: string } & AsyncCallback) {
      params.success && params.success();
    },
  };
  return api;
};
