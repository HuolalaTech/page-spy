import socketStore from '../helpers/socket';
import { SpyStorage } from '../types';
import { PageSpyPlugin } from '../types/lib/index';
import { isNotEmpty } from '../utils';
import { makeMessage } from '../utils/message';

export function dataStringify(data: any) {
  const typeOfValue = typeof data;
  let vStr: string = data;
  if (
    typeOfValue === 'string' ||
    typeOfValue === 'boolean' ||
    typeOfValue === 'number'
  ) {
    vStr = String(data);
  } else if (typeOfValue === 'object') {
    vStr = JSON.stringify(data);
  }
  return vStr;
}

export default class StoragePlugin implements PageSpyPlugin {
  name = 'StoragePlugin';

  static hasInitd = false;

  static originFunctions = {
    setAndLink: AppStorage.setAndLink,
    setAndProp: AppStorage.setAndProp,
    set: AppStorage.set,
    setOrCreate: AppStorage.setOrCreate,
    delete: AppStorage.delete,
    clear: AppStorage.clear,
  };

  public onInit() {
    StoragePlugin.initStorageProxy();
    StoragePlugin.listenRefreshEvent();
  }

  public onReset() {
    Object.entries(StoragePlugin.originFunctions).forEach(([name, fn]) => {
      Object.defineProperty(AppStorage, name, {
        value: fn,
      });
    });
  }

  public static initStorageProxy() {
    const { sendSetItem, sendRemoveItem, sendClearItem } = StoragePlugin;
    ['setAndLink', 'setAndProp'].forEach((fnName) => {
      Object.defineProperties(AppStorage, {
        [fnName]: {
          value: <T>(propName: string, defaultValue: T) => {
            const result = StoragePlugin.originFunctions[fnName](
              propName,
              defaultValue,
            );
            if (isNotEmpty(defaultValue)) {
              const value = AppStorage.get(propName);
              sendSetItem(propName, value);
            }
            return result;
          },
        },
      });
    });

    ['set', 'setOrCreate'].forEach((fnName) => {
      Object.defineProperties(AppStorage, {
        [fnName]: {
          value: <T>(propName: string, newValue: T) => {
            const result = StoragePlugin.originFunctions[fnName](
              propName,
              newValue,
            );
            if (isNotEmpty(newValue)) {
              const value = AppStorage.get(propName);
              sendSetItem(propName, value);
            }
            return result;
          },
        },
      });
    });

    Object.defineProperties(AppStorage, {
      delete: {
        value: (propName: string) => {
          const result = StoragePlugin.originFunctions.delete(propName);
          if (result) {
            sendRemoveItem(propName);
          }
          return result;
        },
      },
      clear: {
        value: () => {
          const result = StoragePlugin.originFunctions.clear();
          if (result) {
            sendClearItem();
          }
          return result;
        },
      },
    });
  }

  public static listenRefreshEvent() {
    socketStore.addListener('refresh', async ({ source }) => {
      const { data: storageType } = source;
      if (storageType === 'AppStorage') {
        StoragePlugin.sendRefresh();
      }
    });
  }

  static sendRefresh() {
    try {
      const keys = AppStorage.keys();

      const data = [...keys].map((key) => {
        return {
          name: key,
          value: dataStringify(AppStorage.get(key)),
        };
      });

      const dataItem: SpyStorage.GetTypeDataItem = {
        type: 'AppStorage',
        action: 'get',
        data,
      };
      StoragePlugin.sendStorageItem(dataItem);
    } catch (e) {
      // TODO
    }
  }

  public static sendSetItem(key: string, value: any) {
    StoragePlugin.sendStorageItem({
      type: 'AppStorage',
      action: 'set',
      name: key,
      value: dataStringify(value),
    } as SpyStorage.SetTypeDataItem);
  }

  public static sendRemoveItem(key: string) {
    StoragePlugin.sendStorageItem({
      type: 'AppStorage',
      action: 'remove',
      name: key,
    } as SpyStorage.RemoveTypeDataItem);
  }

  public static sendClearItem() {
    StoragePlugin.sendStorageItem({
      type: 'AppStorage',
      action: 'clear',
    } as SpyStorage.ClearTypeDataItem);
  }

  public static sendStorageItem(info: Omit<SpyStorage.DataItem, 'id'>) {
    const data = makeMessage('storage', info);
    socketStore.dispatchEvent('public-data', data);
    // The user wouldn't want to get the stale data, so here we set the 2nd parameter to true.
    socketStore.broadcastMessage(data, true);
  }
}
