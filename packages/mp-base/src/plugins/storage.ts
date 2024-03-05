import { makeMessage } from 'base/src/message';
import type { SpyStorage, PageSpyPlugin } from '@huolala-tech/page-spy-types';
import socketStore from 'mp-base/src/helpers/socket';
import { psLog } from 'base/src';
import { getMPSDK, utilAPI } from '../utils';
import Device from '../device';

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

  private static originFunctions = {} as MPStorageAPI;

  // eslint-disable-next-line class-methods-use-this
  public onInit() {
    if (StoragePlugin.hasInitd) return;
    StoragePlugin.hasInitd = true;

    StoragePlugin.initStorageProxy();
    StoragePlugin.listenRefreshEvent();
  }

  public onReset() {
    const mp = getMPSDK();
    Object.entries(StoragePlugin.originFunctions).forEach(([key, fn]) => {
      Object.defineProperty(mp, key, {
        value: fn,
      });
    });
    StoragePlugin.hasInitd = false;
  }

  static sendRefresh() {
    const mp = getMPSDK();
    try {
      const info = mp.getStorageInfoSync();

      const data = info.keys.map((key) => {
        return {
          name: key,
          value: mpDataStringify(utilAPI.getStorage(key)),
        };
      });

      const dataItem: SpyStorage.GetTypeDataItem = {
        type: 'mpStorage',
        action: 'get',
        data,
      };
      StoragePlugin.sendStorageItem(dataItem);
    } catch (e) {
      // TODO
    }
  }

  /* c8 ignore start */
  private static listenRefreshEvent() {
    socketStore.addListener('refresh', async ({ source }) => {
      const { data: storageType } = source;
      if (storageType === 'mpStorage') {
        StoragePlugin.sendRefresh();
      }
    });
  }
  /* c8 ignore stop */

  private static initStorageProxy() {
    const mp = getMPSDK();
    const { sendClearItem, sendRemoveItem, sendSetItem } = StoragePlugin;
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

    Object.defineProperties(mp, {
      setStorage: {
        value(params: Parameters<MPStorageAPI['setStorage']>[0]) {
          return StoragePlugin.originFunctions!.setStorage({
            ...params,
            success(res) {
              sendSetItem(params.key, params.data);
              params.success?.(res);
            },
          });
        },
      },
      setStorageSync: {
        value(keyOrObj: string | { key: string; data: any }, data: any) {
          try {
            let res: any;
            if (
              Device.info.browserType === 'mp-alipay' &&
              (!Device.info.framework || Device.info.framework === 'unknown')
            ) {
              // alipay is so disgusting, here the input is an object
              const obj = keyOrObj as { key: string; data: any };
              res = (StoragePlugin.originFunctions!.setStorageSync as any)(obj);
              sendSetItem(obj.key, obj.data);
            } else {
              const key = keyOrObj as string;
              res = StoragePlugin.originFunctions!.setStorageSync(key, data);
              sendSetItem(key, data);
            }
            return res;
          } catch (e) {
            /* c8 ignore next 3 */
            // TODO e is unknown so we can't use it, for further investigation
            psLog.error(`Failed to set storage synchronously: ${keyOrObj}`);
            throw e;
          }
        },
      },

      removeStorage: {
        value(params: Parameters<MPStorageAPI['removeStorage']>[0]) {
          return StoragePlugin.originFunctions!.removeStorage({
            ...params,
            success(res) {
              sendRemoveItem(params.key);
              params.success?.(res);
            },
          });
        },
      },

      removeStorageSync: {
        // in alipay, the param is an object actually, but it works.
        value(keyOrObj: string) {
          try {
            const res =
              StoragePlugin.originFunctions!.removeStorageSync(keyOrObj);
            sendRemoveItem(res);
            return res;
            /* c8 ignore next 4 */
          } catch (e) {
            psLog.error(`Failed to remove storage synchronously: ${keyOrObj}`);
            throw e;
          }
        },
      },

      clearStorage: {
        value(params: Parameters<MPStorageAPI['clearStorage']>[0]) {
          return StoragePlugin.originFunctions!.clearStorage({
            ...params,
            success(res) {
              sendClearItem();
              params.success?.(res);
            },
          });
        },
      },

      clearStorageSync: {
        value() {
          try {
            const res = StoragePlugin.originFunctions!.clearStorageSync();
            sendClearItem();
            return res;
            /* c8 ignore next 4 */
          } catch (e) {
            psLog.error('Failed to clear storage synchronously');
            throw e;
          }
        },
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
              sendSetItem(kv.key, kv.value);
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
      });
    }
    if (mp.canIUse('batchSetStorage')) {
      Object.defineProperty(mp, 'batchSetStorage', {
        value(params: Parameters<MPStorageAPI['batchSetStorage']>[0]) {
          return StoragePlugin.originFunctions!.batchSetStorage({
            ...params,
            success(res) {
              params.kvList.forEach((kv) => {
                sendSetItem(kv.key, kv.value);
              });
              params.success?.(res);
            },
          });
        },
      });
    }
  }

  private static sendSetItem(key: string, value: any) {
    StoragePlugin.sendStorageItem({
      type: 'mpStorage',
      action: 'set',
      name: key,
      value: mpDataStringify(value),
    } as SpyStorage.SetTypeDataItem);
  }

  private static sendRemoveItem(key: string) {
    StoragePlugin.sendStorageItem({
      type: 'mpStorage',
      action: 'remove',
      name: key,
    } as SpyStorage.RemoveTypeDataItem);
  }

  private static sendClearItem() {
    StoragePlugin.sendStorageItem({
      type: 'mpStorage',
      action: 'clear',
    } as SpyStorage.ClearTypeDataItem);
  }

  private static sendStorageItem(info: Omit<SpyStorage.DataItem, 'id'>) {
    const data = makeMessage('storage', info);
    socketStore.dispatchEvent('public-data', data);
    // The user wouldn't want to get the stale data, so here we set the 2nd parameter to true.
    socketStore.broadcastMessage(data, true);
  }
}
