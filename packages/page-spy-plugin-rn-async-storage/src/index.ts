import { makeMessage } from '@huolala-tech/page-spy-base';
import type {
  SpyStorage,
  PageSpyPlugin,
  OnInitParams,
  SpyBase,
  InitConfigBase,
} from '@huolala-tech/page-spy-types';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type {
  Callback,
  MultiCallback,
} from '@react-native-async-storage/async-storage/lib/typescript/types';

export default class RNAsyncStoragePlugin implements PageSpyPlugin {
  public name = 'RNAsyncStoragePlugin';

  public static hasInitd = false;

  public static originFunctions = {} as typeof AsyncStorage;

  public static socketStore: SpyBase.SocketStoreType | null = null;

  // eslint-disable-next-line class-methods-use-this
  public onInit(params: OnInitParams<InitConfigBase>) {
    if (RNAsyncStoragePlugin.hasInitd) return;
    RNAsyncStoragePlugin.hasInitd = true;

    if (params.socketStore) {
      RNAsyncStoragePlugin.socketStore = params.socketStore;
    }

    RNAsyncStoragePlugin.initStorageProxy();
    RNAsyncStoragePlugin.listenRefreshEvent();
  }

  public onReset() {
    Object.entries(RNAsyncStoragePlugin.originFunctions).forEach(
      ([key, fn]) => {
        Object.defineProperty(AsyncStorage, key, {
          value: fn,
        });
      },
    );
    RNAsyncStoragePlugin.hasInitd = false;
  }

  static async sendRefresh() {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const data = await AsyncStorage.multiGet(keys);
      const dataItem: SpyStorage.GetTypeDataItem = {
        type: 'asyncStorage',
        action: 'get',
        data: data
          .filter((kv) => typeof kv[1] === 'string')
          .map((kv) => {
            return {
              name: kv[0],
              value: kv[1] as string,
            };
          }),
      };
      RNAsyncStoragePlugin.sendStorageItem(dataItem);
    } catch (e) {
      // TODO
    }
  }

  /* c8 ignore start */
  public static listenRefreshEvent() {
    RNAsyncStoragePlugin.socketStore?.addListener(
      'refresh',
      async ({ source }) => {
        const { data: storageType } = source;
        if (storageType === 'asyncStorage') {
          RNAsyncStoragePlugin.sendRefresh();
        }
      },
    );
  }
  /* c8 ignore stop */

  public static initStorageProxy() {
    const { sendClearItem, sendRemoveItem, sendSetItem } = RNAsyncStoragePlugin;
    const proxyFunctions = [
      'setItem',
      'mergeItem',
      'multiSet',
      'multiMerge',
      'removeItem',
      'multiRemove',
      'clear',
    ] as (keyof typeof AsyncStorage)[];

    proxyFunctions.forEach((name) => {
      if (AsyncStorage[name]) {
        // @ts-ignore
        RNAsyncStoragePlugin.originFunctions[name] = AsyncStorage[name];
      }
    });

    Object.defineProperties(AsyncStorage, {
      setItem: {
        value(key: string, value: string, callback?: Callback) {
          return RNAsyncStoragePlugin.originFunctions!.setItem(
            key,
            value,
            callback,
          ).then(() => {
            sendSetItem(key, value);
          });
        },
      },
      mergeItem: {
        value(key: string, value: string, callback?: Callback) {
          return RNAsyncStoragePlugin.originFunctions!.mergeItem(
            key,
            value,
            callback,
          ).then((res) => {
            AsyncStorage.getItem(key).then((v) => {
              if (v !== null) {
                sendSetItem(key, v);
              } else {
                sendRemoveItem(key);
              }
            });
            return res;
          });
        },
      },

      multiSet: {
        value(kvPairs: [string, string][], callback?: MultiCallback) {
          return RNAsyncStoragePlugin.originFunctions!.multiSet(
            kvPairs,
            callback,
          ).then(() => {
            kvPairs.forEach((kv) => {
              sendSetItem(kv[0], kv[1]);
            });
          });
        },
      },
      multiMerge: {
        value(kvPairs: [string, string][], callback?: MultiCallback) {
          return RNAsyncStoragePlugin.originFunctions!.multiMerge(
            kvPairs,
            callback,
          ).then(() => {
            const keys = kvPairs.map((kv) => kv[0]);
            AsyncStorage.multiGet(keys).then((data) => {
              data.forEach((kv) => {
                if (kv[1] !== null) {
                  sendSetItem(kv[0], kv[1]);
                } else {
                  sendRemoveItem(kv[0]);
                }
              });
            });
          });
        },
      },

      removeItem: {
        value(key: string, callback?: Callback) {
          return RNAsyncStoragePlugin.originFunctions!.removeItem(
            key,
            callback,
          ).then(() => {
            sendRemoveItem(key);
          });
        },
      },

      multiRemove: {
        value(keys: readonly string[], callback?: MultiCallback) {
          return RNAsyncStoragePlugin.originFunctions!.multiRemove(
            keys,
            callback,
          ).then(() => {
            keys.forEach((key) => {
              sendRemoveItem(key);
            });
          });
        },
      },

      clear: {
        value(callback?: Callback) {
          return RNAsyncStoragePlugin.originFunctions!.clear(callback).then(
            () => {
              sendClearItem();
            },
          );
        },
      },
    });
  }

  public static sendSetItem(key: string, value: string) {
    RNAsyncStoragePlugin.sendStorageItem({
      type: 'asyncStorage',
      action: 'set',
      name: key,
      value,
    } as SpyStorage.SetTypeDataItem);
  }

  public static sendRemoveItem(key: string) {
    RNAsyncStoragePlugin.sendStorageItem({
      type: 'asyncStorage',
      action: 'remove',
      name: key,
    } as SpyStorage.RemoveTypeDataItem);
  }

  public static sendClearItem() {
    RNAsyncStoragePlugin.sendStorageItem({
      type: 'asyncStorage',
      action: 'clear',
    } as SpyStorage.ClearTypeDataItem);
  }

  public static sendStorageItem(info: Omit<SpyStorage.DataItem, 'id'>) {
    const data = makeMessage('storage', info);
    RNAsyncStoragePlugin.socketStore?.dispatchEvent('public-data', data);
    // The user wouldn't want to get the stale data, so here we set the 2nd parameter to true.
    RNAsyncStoragePlugin.socketStore?.broadcastMessage(data, true);
  }
}
