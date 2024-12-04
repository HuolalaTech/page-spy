import type { SocketStoreBase } from '@huolala-tech/page-spy-base/dist/socket-base';
import { makeMessage } from '@huolala-tech/page-spy-base/dist/message';
import type {
  SpyStorage,
  PageSpyPlugin,
  OnInitParams,
  InitConfigBase,
} from '@huolala-tech/page-spy-types';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type {
  Callback,
  MultiCallback,
} from '@react-native-async-storage/async-storage/lib/typescript/types';

const descriptor = {
  configurable: true,
  writable: true,
  enumerable: true,
};

export default class RNAsyncStoragePlugin implements PageSpyPlugin {
  public name = 'RNAsyncStoragePlugin';

  public static hasInitd = false;

  public static originFunctions = {} as typeof AsyncStorage;

  public $socketStore: SocketStoreBase | null = null;

  public $pageSpyConfig: InitConfigBase | null = null;

  public onInit(params: OnInitParams<InitConfigBase>) {
    if (RNAsyncStoragePlugin.hasInitd) return;
    RNAsyncStoragePlugin.hasInitd = true;

    this.$pageSpyConfig = params.config;
    this.$socketStore = params.socketStore;

    this.initStorageProxy();
    this.listenRefreshEvent();
  }

  public onReset() {
    Object.entries(RNAsyncStoragePlugin.originFunctions).forEach(
      ([key, fn]) => {
        Object.defineProperty(AsyncStorage, key, {
          value: fn,
          ...descriptor,
        });
      },
    );
    RNAsyncStoragePlugin.hasInitd = false;
  }

  async sendRefresh() {
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
      this.sendStorageItem(dataItem);
    } catch (e) {
      // TODO
    }
  }

  /* c8 ignore start */
  public listenRefreshEvent() {
    this.$socketStore?.addListener('refresh', async ({ source }) => {
      const { data: storageType } = source;
      if (storageType === 'asyncStorage') {
        this.sendRefresh();
      }
    });
  }
  /* c8 ignore stop */

  public initStorageProxy() {
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

    const that = this;
    Object.defineProperties(AsyncStorage, {
      setItem: {
        value(key: string, value: string, callback?: Callback) {
          return RNAsyncStoragePlugin.originFunctions!.setItem(
            key,
            value,
            callback,
          ).then(() => {
            that.sendSetItem(key, value);
          });
        },
        ...descriptor,
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
                that.sendSetItem(key, v);
              } else {
                that.sendRemoveItem(key);
              }
            });
            return res;
          });
        },
        ...descriptor,
      },

      multiSet: {
        value(kvPairs: [string, string][], callback?: MultiCallback) {
          return RNAsyncStoragePlugin.originFunctions!.multiSet(
            kvPairs,
            callback,
          ).then(() => {
            kvPairs.forEach((kv) => {
              that.sendSetItem(kv[0], kv[1]);
            });
          });
        },
        ...descriptor,
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
                  that.sendSetItem(kv[0], kv[1]);
                } else {
                  that.sendRemoveItem(kv[0]);
                }
              });
            });
          });
        },
        ...descriptor,
      },

      removeItem: {
        value(key: string, callback?: Callback) {
          return RNAsyncStoragePlugin.originFunctions!.removeItem(
            key,
            callback,
          ).then(() => {
            that.sendRemoveItem(key);
          });
        },
        ...descriptor,
      },

      multiRemove: {
        value(keys: readonly string[], callback?: MultiCallback) {
          return RNAsyncStoragePlugin.originFunctions!.multiRemove(
            keys,
            callback,
          ).then(() => {
            keys.forEach((key) => {
              that.sendRemoveItem(key);
            });
          });
        },
        ...descriptor,
      },

      clear: {
        value(callback?: Callback) {
          return RNAsyncStoragePlugin.originFunctions!.clear(callback).then(
            () => {
              that.sendClearItem();
            },
          );
        },
        ...descriptor,
      },
    });
  }

  public sendSetItem(key: string, value: string) {
    this.sendStorageItem({
      type: 'asyncStorage',
      action: 'set',
      name: key,
      value,
    } as SpyStorage.SetTypeDataItem);
  }

  public sendRemoveItem(key: string) {
    this.sendStorageItem({
      type: 'asyncStorage',
      action: 'remove',
      name: key,
    } as SpyStorage.RemoveTypeDataItem);
  }

  public sendClearItem() {
    this.sendStorageItem({
      type: 'asyncStorage',
      action: 'clear',
    } as SpyStorage.ClearTypeDataItem);
  }

  public sendStorageItem(info: Omit<SpyStorage.DataItem, 'id'>) {
    const processedByUser = this.$pageSpyConfig?.dataProcessor?.storage?.(
      info as any,
    );
    if (processedByUser === false) return;

    const data = makeMessage('storage', info);
    this.$socketStore?.dispatchEvent('public-data', data);
    // The user wouldn't want to get the stale data, so here we set the 2nd parameter to true.
    this.$socketStore?.broadcastMessage(data, true);
  }
}
