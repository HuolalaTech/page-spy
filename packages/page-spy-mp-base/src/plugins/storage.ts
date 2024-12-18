import { psLog } from '@huolala-tech/page-spy-base/dist/utils';
import type { Client } from '@huolala-tech/page-spy-base/dist/client';
import { makeMessage } from '@huolala-tech/page-spy-base/dist/message';
import type {
  SpyStorage,
  PageSpyPlugin,
  SpyMP,
  OnInitParams,
} from '@huolala-tech/page-spy-types';
import socketStore from '../helpers/socket';
import type { MPStorageAPI, KVList } from '../types';
import { getMPSDK, getOriginMPSDK } from '../helpers/mp-api';

const descriptor = {
  configurable: true,
  writable: true,
  enumerable: true,
};

export function mpDataStringify(data: any) {
  const typeOfValue = typeof data;
  let vStr: string = data;
  if (
    typeOfValue === 'string' ||
    typeOfValue === 'boolean' ||
    typeOfValue === 'number'
  ) {
    vStr = String(data);
  } else if (typeOfValue === 'object') {
    if (data instanceof Date) {
      vStr = data.toDateString();
    } else {
      vStr = JSON.stringify(data);
    }
  }
  return vStr;
}

export default class StoragePlugin implements PageSpyPlugin {
  public name = 'StoragePlugin';

  public static hasInitd = false;

  public static originFunctions = {} as MPStorageAPI;

  public $pageSpyConfig: SpyMP.MPInitConfig | null = null;

  public client: Client | null = null;

  public onInit({ config, client }: OnInitParams<SpyMP.MPInitConfig>) {
    if (StoragePlugin.hasInitd) return;
    StoragePlugin.hasInitd = true;

    this.$pageSpyConfig = config;
    this.client = client;
    this.initStorageProxy();
    this.listenRefreshEvent();
  }

  public onReset() {
    const mp = getOriginMPSDK();
    Object.entries(StoragePlugin.originFunctions).forEach(([key, fn]) => {
      Object.defineProperty(mp, key, {
        value: fn,
        ...descriptor,
      });
    });
    StoragePlugin.hasInitd = false;
  }

  sendRefresh() {
    const mp = getMPSDK();
    try {
      const info = mp.getStorageInfoSync();

      const data = info.keys.map((key) => {
        return {
          name: key,
          value: mpDataStringify(mp.getStorageSync(key)),
        };
      });

      const dataItem: SpyStorage.GetTypeDataItem = {
        type: 'mpStorage',
        action: 'get',
        data,
      };
      this.sendStorageItem(dataItem);
    } catch (e) {
      // TODO
    }
  }

  /* c8 ignore start */
  public listenRefreshEvent() {
    socketStore.addListener('refresh', async ({ source }) => {
      const { data: storageType } = source;
      if (storageType === 'mpStorage') {
        this.sendRefresh();
      }
    });
  }
  /* c8 ignore stop */

  public initStorageProxy() {
    const mp = getOriginMPSDK();
    const proxyFunctions = [
      'setStorage',
      'setStorageSync',
      'removeStorage',
      'removeStorageSync',
      'clearStorage',
      'clearStorageSync',
      'batchSetStorageSync',
      'batchSetStorage',
    ] as (keyof MPStorageAPI)[];

    proxyFunctions.forEach((name) => {
      if (mp[name]) {
        // @ts-ignore
        StoragePlugin.originFunctions[name] = mp[name];
      }
    });

    const that = this;

    Object.defineProperties(mp, {
      setStorage: {
        value(params: Parameters<MPStorageAPI['setStorage']>[0]) {
          return StoragePlugin.originFunctions!.setStorage({
            ...params,
            success(res) {
              that.sendSetItem(params.key, params.data);
              params.success?.(res);
            },
          });
        },
        ...descriptor,
      },
      setStorageSync: {
        value(keyOrObj: string | { key: string; data: any }, data: any) {
          try {
            let res: any;
            if (
              that.client?.info.browserType === 'mp-alipay' &&
              (!that.client.info.framework ||
                that.client.info.framework === 'unknown')
            ) {
              // alipay is so disgusting, here the input is an object
              const obj = keyOrObj as { key: string; data: any };
              res = (StoragePlugin.originFunctions!.setStorageSync as any)(obj);
              that.sendSetItem(obj.key, obj.data);
            } else {
              const key = keyOrObj as string;
              res = StoragePlugin.originFunctions!.setStorageSync(key, data);
              that.sendSetItem(key, data);
            }
            return res;
          } catch (e) {
            /* c8 ignore next 3 */
            // TODO e is unknown so we can't use it, for further investigation
            psLog.error(`Failed to set storage synchronously: ${keyOrObj}`);
            throw e;
          }
        },
        ...descriptor,
      },

      removeStorage: {
        value(params: Parameters<MPStorageAPI['removeStorage']>[0]) {
          return StoragePlugin.originFunctions!.removeStorage({
            ...params,
            success(res) {
              that.sendRemoveItem(params.key);
              params.success?.(res);
            },
          });
        },
        ...descriptor,
      },

      removeStorageSync: {
        value(keyOrObj: string | { key: string }) {
          try {
            const res =
              StoragePlugin.originFunctions!.removeStorageSync(keyOrObj);
            const key = typeof keyOrObj === 'string' ? keyOrObj : keyOrObj.key;
            that.sendRemoveItem(key);
            return res;
            /* c8 ignore next 4 */
          } catch (e) {
            psLog.error(`Failed to remove storage synchronously: ${keyOrObj}`);
            throw e;
          }
        },
        ...descriptor,
      },

      clearStorage: {
        value(params: Parameters<MPStorageAPI['clearStorage']>[0]) {
          return StoragePlugin.originFunctions!.clearStorage({
            ...params,
            success(res) {
              that.sendClearItem();
              params.success?.(res);
            },
          });
        },
        ...descriptor,
      },

      clearStorageSync: {
        value() {
          try {
            const res = StoragePlugin.originFunctions!.clearStorageSync();
            that.sendClearItem();
            return res;
            /* c8 ignore next 4 */
          } catch (e) {
            psLog.error('Failed to clear storage synchronously');
            throw e;
          }
        },
        ...descriptor,
      },
    });

    if (mp.canIUse('batchSetStorageSync')) {
      Object.defineProperty(mp, 'batchSetStorageSync', {
        value(kvList: KVList) {
          // alipay doesn't have batch action, so do nothing
          try {
            const res =
              StoragePlugin.originFunctions!.batchSetStorageSync(kvList);
            kvList.forEach((kv) => {
              that.sendSetItem(kv.key, kv.value);
            });
            return res;
            /* c8 ignore next 7 */
          } catch (e) {
            psLog.error(
              `Failed to batch set storage synchronously: ${JSON.stringify(
                kvList.map((kv) => kv.key),
              )}`,
            );
            throw e;
          }
        },
        ...descriptor,
      });
    }
    if (mp.canIUse('batchSetStorage')) {
      Object.defineProperty(mp, 'batchSetStorage', {
        value(params: Parameters<MPStorageAPI['batchSetStorage']>[0]) {
          return StoragePlugin.originFunctions!.batchSetStorage({
            ...params,
            success(res) {
              params.kvList.forEach((kv) => {
                that.sendSetItem(kv.key, kv.value);
              });
              params.success?.(res);
            },
          });
        },
        ...descriptor,
      });
    }
  }

  public sendSetItem(key: string, value: any) {
    this.sendStorageItem({
      type: 'mpStorage',
      action: 'set',
      name: key,
      value: mpDataStringify(value),
    } as SpyStorage.SetTypeDataItem);
  }

  public sendRemoveItem(key: string) {
    this.sendStorageItem({
      type: 'mpStorage',
      action: 'remove',
      name: key,
    } as SpyStorage.RemoveTypeDataItem);
  }

  public sendClearItem() {
    this.sendStorageItem({
      type: 'mpStorage',
      action: 'clear',
    } as SpyStorage.ClearTypeDataItem);
  }

  public sendStorageItem(info: Omit<SpyStorage.DataItem, 'id'>) {
    const processedByUser = this.$pageSpyConfig?.dataProcessor?.storage?.(
      info as any,
    );
    if (processedByUser === false) return;

    const data = makeMessage('storage', info);
    socketStore.dispatchEvent('public-data', data);
    // The user wouldn't want to get the stale data, so here we set the 2nd parameter to true.
    socketStore.broadcastMessage(data, true);
  }
}
