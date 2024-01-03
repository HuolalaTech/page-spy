import { mockRequest } from './mock/request';

Object.defineProperty(globalThis, 'name', {
  value: '小程序单元测试',
});

export {};

function apiCallbackOptions() {
  return {
    success() {},
    fail() {},
    complete() {},
  };
}

Object.defineProperty(globalThis, 'wx', {
  value: {
    setStorage(params: AsyncCallback) {
      setTimeout(() => {
        params.success?.();
      }, 0);
    },
    setStorageSync() {},
    batchSetStorage(params: AsyncCallback) {
      setTimeout(() => {
        params.success?.();
      }, 0);
    },
    batchSetStorageSync() {},
    getStorage(params: AsyncCallback) {
      setTimeout(() => {
        params.success?.();
      }, 0);
    },
    getStorageSync() {},
    batchGetStorage() {},
    batchGetStorageSync() {},
    removeStorage(params: AsyncCallback) {
      setTimeout(() => {
        params.success?.();
      }, 0);
    },
    removeStorageSync() {},
    clearStorage(params: AsyncCallback) {
      setTimeout(() => {
        params.success?.();
      }, 0);
    },
    clearStorageSync() {},

    request: mockRequest,
    connectSocket(params: { url: string }) {
      let closeHandler: (res: any) => void;
      let openHandler: (res: any) => void;
      let messageHandler: (data: object) => void;
      let errorHandler: (msg: string) => void;
      return {
        send(data: object) {},
        onOpen(handler: (res: any) => void) {
          openHandler = handler;
        },
        onClose(handler: (res: any) => void) {
          closeHandler = handler;
        },
        onError(handler: (msg: string) => void) {
          errorHandler = handler;
        },
        close() {},
        onMessage(handler: (data: object) => void) {
          messageHandler = handler;
        },
      } as MPWeixinSocket;
    },

    getSystemInfoSync() {
      return {
        platform: 'devtools',
        version: '1.0.0',
        system: 'iOS 14.0.1',
      };
    },
  },
});

Object.defineProperty(globalThis, 'getCurrentPages', {
  value: function () {
    return [
      {
        route: 'page/index/index',
        options: {
          aaa: 'bbb',
        },
      },
    ];
  },
});
