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
    setStorage(params) {
      // params.success()
    },
    setStorageSync() {},
    batchSetStorage() {},
    batchSetStorageSync() {},
    getStorage() {},
    getStorageSync() {},
    batchGetStorage() {},
    batchGetStorageSync() {},
    removeStorage() {},
    removeStorageSync() {},
    clearStorage() {},
    clearStorageSync() {},

    request() {},
    connectSocket() {},
  },
});
