import { SocketState } from 'base/src/socket-base';
import { mockRequest } from './request';
import EventEmitter from 'events';
type CBType = (event?: any) => any;

export class MockSocket {
  private ee = new EventEmitter();
  status: SocketState = SocketState.CONNECTING;
  send(params: { data: string | Buffer }) {}
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
  onMessage(handler: (data: string | Buffer) => void) {
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

export class MockMP implements MPSystemAPI, MPNetworkAPI, MPStorageAPI {
  private store: Record<string, any> = {};
  private listeners = new Map<string, CBType[]>();
  private socketInstance: MockSocket | null = null;
  constructor() {
    this.listeners.set('onError', []);
    this.listeners.set('onUnHandledRejection', []);
    this.listeners.set('onAppShow', []);
  }

  trigger(name: string, data?: any) {
    this.listeners.get(name)?.forEach((cb) => cb(data));
  }
  off(name: string, cb: CBType) {
    this.listeners
      .get(name)
      ?.splice(this.listeners.get(name)?.indexOf(cb) || 0, 1);
  }

  setStorage(params: { key: string; data: any } & AsyncCallback<any, any>) {
    this.store[params.key] = params.data;
    params.success && params.success();
  }
  getStorage(params: { key: string } & AsyncCallback<any, any>) {
    params.success && params.success(this.store[params.key]);
  }
  removeStorage(params: { key: string } & AsyncCallback<any, any>) {
    delete this.store[params.key];
    params.success && params.success();
  }

  clearStorage(params: {} & AsyncCallback<any, any>) {
    this.store = {};
    params.success?.();
  }

  // getStorageInfo(params: { } & AsyncCallback<any, any>) {
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
  batchSetStorage(params: { kvList: KVList } & AsyncCallback<any, any>) {
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

  connectSocket(params: { url: string }) {
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
    params: { data: string | Buffer } & AsyncCallback<any, any>,
  ): void {
    this.socketInstance?.send(params);
  }
  closeSocket(params: AsyncCallback<any, any>): void {
    this.socketInstance?.close();
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
  onUnHandledRejection(cb: CBType) {
    this.listeners.get('onUnHandledRejection')?.push(cb);
  }
  offUnHandledRejection(cb: CBType) {
    this.off('onUnHandledRejection', cb);
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
  switchTab(params: { url: string } & AsyncCallback<any, any>) {
    params.success && params.success();
  }
  redirectTo(params: { url: string } & AsyncCallback<any, any>) {
    params.success && params.success();
  }
  navigateTo(params: { url: string } & AsyncCallback<any, any>) {
    params.success && params.success();
  }
  navigateBack(params: { delta?: number } & AsyncCallback<any, any>) {
    params.success && params.success();
  }
  reLaunch(params: { url: string } & AsyncCallback<any, any>) {
    params.success && params.success();
  }
}
