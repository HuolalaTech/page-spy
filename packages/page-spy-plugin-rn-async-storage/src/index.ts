import { makeMessage } from 'base/src/message';
import type {
  SpyStorage,
  PageSpyPlugin,
  OnInitParams,
  SpyBase,
} from '@huolala-tech/page-spy-types';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type {
  Callback,
  MultiCallback,
} from '@react-native-async-storage/async-storage/src/types';

export default class RNAsyncStoragePlugin implements PageSpyPlugin {
  public name = 'RNAsyncStoragePlugin';

  public static hasInitd = false;

  private static originFunctions = {} as typeof AsyncStorage;

  private static socketStore: SpyBase.SocketStoreType | null = null;

  // eslint-disable-next-line class-methods-use-this
  public onInit(params: OnInitParams) {
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
  private static listenRefreshEvent() {
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

  private static initStorageProxy() {
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
            return;
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
            return;
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
            return;
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
            return;
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
            return;
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

  private static sendSetItem(key: string, value: string) {
    RNAsyncStoragePlugin.sendStorageItem({
      type: 'asyncStorage',
      action: 'set',
      name: key,
      value,
    } as SpyStorage.SetTypeDataItem);
  }

  private static sendRemoveItem(key: string) {
    RNAsyncStoragePlugin.sendStorageItem({
      type: 'asyncStorage',
      action: 'remove',
      name: key,
    } as SpyStorage.RemoveTypeDataItem);
  }

  private static sendClearItem() {
    RNAsyncStoragePlugin.sendStorageItem({
      type: 'asyncStorage',
      action: 'clear',
    } as SpyStorage.ClearTypeDataItem);
  }

  private static sendStorageItem(info: Omit<SpyStorage.DataItem, 'id'>) {
    const data = makeMessage('storage', info);
    RNAsyncStoragePlugin.socketStore?.dispatchEvent('public-data', data);
    // The user wouldn't want to get the stale data, so here we set the 2nd parameter to true.
    RNAsyncStoragePlugin.socketStore?.broadcastMessage(data, true);
  }
}
