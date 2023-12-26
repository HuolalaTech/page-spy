import { makeMessage, DEBUG_MESSAGE_TYPE } from 'src/utils/message';
import { SpyStorage } from 'types';
import type PageSpyPlugin from 'src/utils/plugin';
import socketStore from 'miniprogram/helpers/socket';
import { psLog } from 'src/utils';

function mpDataStringify(data: any) {
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

export class StoragePlugin implements PageSpyPlugin {
  public name = 'StoragePlugin';

  public static hasInitd = false;

  // eslint-disable-next-line class-methods-use-this
  public onCreated() {
    if (StoragePlugin.hasInitd) return;
    StoragePlugin.hasInitd = true;

    StoragePlugin.listenRefreshEvent();
    StoragePlugin.initStorageProxy();
  }

  private static listenRefreshEvent() {
    socketStore.addListener(DEBUG_MESSAGE_TYPE.REFRESH, async ({ source }) => {
      const { data: storageType } = source;
      if (storageType === 'mpStorage') {
        try {
          const info = wx.getStorageInfoSync();

          const data = info.keys.map((key) => {
            return {
              name: key,
              value: mpDataStringify(wx.getStorageSync(key)),
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
    });
  }

  private static initStorageProxy() {
    const { sendClearItem, sendRemoveItem, sendSetItem } = StoragePlugin;
    const proxyFunctions = [
      'setStorage',
      'setStorageSync',
      'batchSetStorage',
      'batchSetStorageSync',
      'getStorage',
      'getStorageSync',
      'batchGetStorage',
      'batchGetStorageSync',
      'removeStorage',
      'removeStorageSync',
      'clearStorage',
      'clearStorageSync',
    ] as (keyof WXStorageAPI)[];

    const originFunc = {} as WXStorageAPI;
    proxyFunctions.forEach((name) => {
      (originFunc as any)[name] = wx[name];
    });

    wx.setStorage = function (
      params: Parameters<WXStorageAPI['setStorage']>[0],
    ) {
      return originFunc.setStorage({
        ...params,
        success(res) {
          sendSetItem(params.key, params.data);
          params.success?.(res);
        },
      });
    };

    wx.setStorageSync = function (key: string, data: any) {
      try {
        const res = originFunc.setStorageSync(key, data);
        sendSetItem(key, data);
        return res;
      } catch (e) {
        // TODO e is unknown so we can't use it, for further investigation
        psLog.error(`Failed to set storage synchronously: ${key}`);
        throw e;
      }
    };

    wx.batchSetStorage = function (
      params: Parameters<WXStorageAPI['batchSetStorage']>[0],
    ) {
      return originFunc.batchSetStorage({
        ...params,
        success(res) {
          params.kvList.forEach((kv) => {
            sendSetItem(kv.key, kv.value);
          });
          params.success?.(res);
        },
      });
    };

    wx.batchSetStorageSync = function (kvList: KVList) {
      try {
        const res = originFunc.batchSetStorageSync(kvList);
        kvList.forEach((kv) => {
          sendSetItem(kv.key, kv.value);
        });
        return res;
      } catch (e) {
        psLog.error(
          `Failed to batch set storage synchronously: ${JSON.stringify(
            kvList.map((kv) => kv.key),
          )}`,
        );
        throw e;
      }
    };

    wx.removeStorage = function (
      params: Parameters<WXStorageAPI['removeStorage']>[0],
    ) {
      return originFunc.removeStorage({
        ...params,
        success(res) {
          sendRemoveItem(params.key);
          params.success?.(res);
        },
      });
    };

    wx.removeStorageSync = function (key: string) {
      try {
        const res = originFunc.removeStorageSync(key);
        sendRemoveItem(res);
        return res;
      } catch (e) {
        psLog.error(`Failed to remove storage synchronously: ${key}`);
        throw e;
      }
    };

    wx.clearStorage = function (
      params: Parameters<WXStorageAPI['clearStorage']>[0],
    ) {
      return originFunc.clearStorage({
        ...params,
        success(res) {
          sendClearItem();
          params.success?.(res);
        },
      });
    };

    wx.clearStorageSync = function () {
      try {
        const res = originFunc.clearStorageSync();
        sendClearItem();
        return res;
      } catch (e) {
        psLog.error('Failed to clear storage synchronously');
        throw e;
      }
    };
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
    const data = makeMessage(DEBUG_MESSAGE_TYPE.STORAGE, info);
    // The user wouldn't want to get the stale data, so here we set the 2nd parameter to true.
    socketStore.broadcastMessage(data, true);
  }
}
