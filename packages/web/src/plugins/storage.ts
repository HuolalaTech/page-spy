import { makeMessage, DEBUG_MESSAGE_TYPE } from 'src/utils/message';
import { SpyStorage } from 'types/web';
import type PageSpyPlugin from 'src/utils/plugin';
import socketStore from 'web/helpers/socket';

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

  static async sendRefresh(type: string) {
    let result: SpyStorage.GetTypeDataItem | null = null;

    switch (type) {
      case 'localStorage':
      case 'sessionStorage':
        result = StoragePlugin.takeStorage(type);
        break;
      case 'cookie':
        result = await StoragePlugin.takeCookie();
        break;
      /* c8 ignore next 2 */
      default:
        break;
    }

    if (result) {
      StoragePlugin.sendStorageItem(result);
    }
  }

  private static listenRefreshEvent() {
    /* c8 ignore next 5 */
    socketStore.addListener(DEBUG_MESSAGE_TYPE.REFRESH, async ({ source }) => {
      /* c8 ignore next 3 */
      const { data } = source;
      StoragePlugin.sendRefresh(data);
    });
  }

  private static takeStorage(type: 'localStorage' | 'sessionStorage') {
    const data: SpyStorage.GetTypeDataItem = {
      type,
      action: 'get',
      data: [],
    };
    const storage = window[type];
    const size = storage.length;
    if (!size) return data;

    for (let i = 0; i <= size - 1; i++) {
      const name = storage.key(i);
      if (name) {
        const value = storage.getItem(name) || '';
        data.data.push({
          name,
          value,
        });
      }
    }
    return data;
  }

  private static async takeCookie() {
    const data: SpyStorage.GetTypeDataItem = {
      type: 'cookie',
      action: 'get',
      data: [],
    };
    if (window.cookieStore) {
      data.data = await window.cookieStore.getAll();
    } /* c8 ignore start */ else {
      data.data = document.cookie.split('; ').map((item) => {
        const [name, value] = item.split('=');
        return {
          name,
          value,
        };
      });
    } /* c8 ignore stop */
    return data;
  }

  private static initStorageProxy() {
    const { getStorageType, sendStorageItem } = StoragePlugin;
    const { clear, removeItem, setItem } = Storage.prototype;

    Storage.prototype.clear = function () {
      clear.call(this);
      const data = {
        type: getStorageType(this),
        action: 'clear',
      } as const;
      sendStorageItem(data);
    };
    Storage.prototype.removeItem = function (name: string) {
      removeItem.call(this, name);
      const data = {
        type: getStorageType(this),
        action: 'remove',
        name: String(name),
      } as const;
      sendStorageItem(data);
    };
    Storage.prototype.setItem = function (name: string, value: string) {
      setItem.call(this, name, value);
      const data = {
        type: getStorageType(this),
        action: 'set',
        name: String(name),
        value: String(value),
      } as const;
      sendStorageItem(data);
    };

    if (window.cookieStore) {
      window.cookieStore.addEventListener('change', (e) => {
        const { changed, deleted } = e as CookieChangeEvent;
        if (changed.length > 0) {
          changed.forEach((cookie) => {
            const data = {
              type: 'cookie',
              action: 'set',
              ...cookie,
            } as const;
            StoragePlugin.sendStorageItem(data);
          });
        }
        if (deleted.length > 0) {
          deleted.forEach((cookie) => {
            const data = {
              type: 'cookie',
              action: 'remove',
              name: cookie.name,
            } as const;
            StoragePlugin.sendStorageItem(data);
          });
        }
      });
    }
  }

  private static getStorageType(ins: Storage): SpyStorage.DataType {
    if (ins === localStorage) return 'localStorage';
    if (ins === sessionStorage) return 'sessionStorage';
    return ins.constructor.name as any;
  }

  private static sendStorageItem(info: Omit<SpyStorage.DataItem, 'id'>) {
    const data = makeMessage(DEBUG_MESSAGE_TYPE.STORAGE, info);
    // The user wouldn't want to get the stale data, so here we set the 2nd parameter to true.
    socketStore.broadcastMessage(data, true);
  }
}
