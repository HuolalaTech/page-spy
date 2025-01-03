import { KVList } from './../../src/types';
import { AsyncCallback, MPStorageAPI } from 'page-spy-mp-base/src/types';
import { getMPSDK } from 'page-spy-mp-base/src/utils';

export function mockWXStorage(): MPStorageAPI {
  let store: Record<string, any> = {};
  return {
    setStorage(params: { key: string; data: any } & AsyncCallback) {
      store[params.key] = params.data;
      params.success && params.success();
    },
    getStorage(params: { key: string } & AsyncCallback<any, any>) {
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

    // getStorageInfo(params: { } & AsyncCallback<any, any>) {
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
  };
}

export function initStorageMock() {
  const mock = mockWXStorage();
  Object.entries(mock).forEach(([key, value]) => {
    Object.defineProperty(getMPSDK(), key, {
      value,
      writable: true,
      configurable: true,
      enumerable: true,
    });
  });
}
