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
    connectSocket() {},
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
