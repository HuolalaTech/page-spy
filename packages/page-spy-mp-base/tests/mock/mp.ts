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

export class MockMP
  implements
    MPSystemAPI,
    MPNetworkAPI,
    MPStorageAPI,
    MPSystemAPI,
    MPRouterAPI,
    MPUIAPI,
    MPFileAPI
{
  private store: Record<string, any> = {};
  private listeners = new Map<string, CBType[]>();
  private socketInstance: MockSocket | null = null;
  constructor() {
    this.listeners.set('onError', []);
    this.listeners.set('onUnhandledRejection', []);
    this.listeners.set('onAppShow', []);
  }

  env = { USER_DATA_PATH: '' };

  trigger(name: string, data?: any) {
    this.listeners.get(name)?.forEach((cb) => cb(data));
  }
  off(name: string, cb: CBType) {
    this.listeners
      .get(name)
      ?.splice(this.listeners.get(name)?.indexOf(cb) || 0, 1);
  }

  setClipboardData(options: { data: string } & AsyncCallback): void {
    options.success?.();
    options.complete?.();
  }

  showActionSheet(params: any) {}

  showToast(params: any) {}

  hideToast() {}

  showLoading(params: any) {}

  hideLoading() {}

  showModal(params: Parameters<MPUIAPI['showModal']>[0]) {
    params.success?.({ confirm: true, cancel: false });
  }

  setStorage(params: { key: string; data: any } & AsyncCallback) {
    this.store[params.key] = params.data;
    params.success && params.success();
  }
  getStorage(params: { key: string } & AsyncCallback) {
    params.success && params.success(this.store[params.key]);
  }
  removeStorage(params: { key: string } & AsyncCallback) {
    delete this.store[params.key];
    params.success && params.success();
  }

  clearStorage(params: {} & AsyncCallback) {
    this.store = {};
    params.success?.();
  }

  // getStorageInfo(params: { } & AsyncCallback) {
  //   params.success && params.success({
  //     keys: Object.keys(store),
  //     currentSize: 0,
  //     limitSize: 0,
  //   })
  // },
  getStorageSync(key: string) {
    return this.store[key];
  }
  clearStorageSync() {
    this.store = {};
  }
  setStorageSync(key: string, data: any) {
    this.store[key] = data;
  }

  getStorageInfoSync() {
    return {
      keys: Object.keys(this.store),
      currentSize: 0,
      limitSize: 0,
    };
  }
  removeStorageSync(key: string) {
    delete this.store[key];
  }
  // getStorageKeys(params: { } & AsyncCallback<any, any>) {
  //   params.success && params.success(Object.keys(store))
  // },
  // getStorageKeysSync() {
  //   return Object.keys(store)
  // },
  batchGetStorage(params: { keyList: string[] } & AsyncCallback<any, any>) {
    params.success &&
      params.success(params.keyList.map((key) => this.store[key]));
  }
  batchGetStorageSync(keyList: string[]) {
    return keyList.map((key) => this.store[key]);
  }
  batchSetStorage(params: { kvList: KVList } & AsyncCallback) {
    params.kvList.forEach((kv) => {
      this.store[kv.key] = kv.value;
    });
    params.success && params.success();
  }
  batchSetStorageSync(kvList: KVList) {
    kvList.forEach((kv) => {
      this.store[kv.key] = kv.value;
    });
  }

  request = mockRequest;

  connectSocket(params: Parameters<MPNetworkAPI['connectSocket']>[0]) {
    // let closeHandler: (res: any) => void;
    // let openHandler: (res: any) => void;
    // let messageHandler: (data: object) => void;
    // let errorHandler: (msg: string) => void;
    // let status: SocketState = SocketState.OPEN;
    this.socketInstance = new MockSocket();
    return this.socketInstance;
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
  }

  onSocketClose(handler: SocketOnCloseHandler): void {
    this.socketInstance?.onClose(handler);
  }
  onSocketError(handler: SocketOnErrorHandler): void {
    this.socketInstance?.onError(handler);
  }
  onSocketMessage(handler: SocketOnMessageHandler): void {
    this.socketInstance?.onMessage(handler);
  }
  onSocketOpen(handler: SocketOnOpenHandler): void {
    this.socketInstance?.onOpen(handler);
  }
  sendSocketMessage(
    params: { data: string | ArrayBuffer } & AsyncCallback<any, any>,
  ): void {
    this.socketInstance?.send(params);
  }
  closeSocket(params: AsyncCallback<any, any>): void {
    this.socketInstance?.close();
  }

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
  }

  getFileSystemManager(): FileSystemManager {
    return {
      writeFile(params: Parameters<FileSystemManager['writeFile']>[0]) {
        params.success?.();
      },

      writeFileSync(params: Parameters<FileSystemManager['writeFileSync']>[0]) {
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
  }

  canIUse(api: string) {
    return true;
  }

  getSystemInfoSync() {
    return {
      platform: 'devtools',
      version: '1.0.0',
      system: 'iOS 14.0.1',
    } as ReturnType<MPSystemAPI['getSystemInfoSync']>;
  }

  onError(cb: CBType) {
    this.listeners.get('onError')?.push(cb);
  }
  offError(cb: CBType) {
    this.off('onError', cb);
  }
  onUnhandledRejection(cb: CBType) {
    this.listeners.get('onUnhandledRejection')?.push(cb);
  }
  offUnhandledRejection(cb: CBType) {
    this.off('onUnhandledRejection', cb);
  }
  onAppShow(cb: CBType) {
    this.listeners.get('onAppShow')?.push(cb);
  }
  offAppShow(listener: () => void): void {
    this.off('onAppShow', listener);
  }
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
  }

  // router
  switchTab(params: { url: string } & AsyncCallback) {
    params.success && params.success();
  }
  redirectTo(params: { url: string } & AsyncCallback) {
    params.success && params.success();
  }
  navigateTo(params: { url: string } & AsyncCallback) {
    params.success && params.success();
  }
  navigateBack(params: { delta?: number } & AsyncCallback) {
    params.success && params.success();
  }
  reLaunch(params: { url: string } & AsyncCallback) {
    params.success && params.success();
  }
}
