import { makeMessage, DEBUG_MESSAGE_TYPE } from 'src/utils/message';
import type { SpyStorage } from 'types';
import type PageSpyPlugin from './index';
import socketStore from '../utils/socket';

export class StoragePlugin implements PageSpyPlugin {
  public name = 'StoragePlugin';

  public static hasInitd = false;

  // eslint-disable-next-line class-methods-use-this
  public onCreated() {
    if (StoragePlugin.hasInitd) return;
    StoragePlugin.hasInitd = true;

    StoragePlugin.takeLocalStorage();
    StoragePlugin.takeSessionStorage();
    StoragePlugin.takeCookie();

    StoragePlugin.listenRefreshEvent();
    StoragePlugin.initStorageProxy();
  }

  private static takeLocalStorage() {
    const local = { ...localStorage };
    Object.keys(local).forEach((name) => {
      const value = local[name];
      StoragePlugin.sendStorageItem({
        type: 'localStorage',
        action: 'get',
        name,
        value,
      });
    });
  }

  private static takeSessionStorage() {
    const session = { ...sessionStorage };
    Object.keys(session).forEach((name) => {
      const value = session[name];
      StoragePlugin.sendStorageItem({
        type: 'sessionStorage',
        action: 'get',
        name,
        value,
      });
    });
  }

  private static takeCookie() {
    if (window.cookieStore) {
      window.cookieStore.getAll().then((cookies) => {
        cookies.forEach((cookie) => {
          const data = StoragePlugin.formatCookieInfo(cookie);
          StoragePlugin.sendStorageItem(data);
        });
      });
      window.cookieStore.addEventListener('change', (e) => {
        const { changed, deleted } = e as CookieChangeEvent;
        if (changed.length > 0) {
          changed.forEach((cookie) => {
            const data = StoragePlugin.formatCookieInfo(cookie, 'set');
            StoragePlugin.sendStorageItem(data);
          });
        }
        if (deleted.length > 0) {
          deleted.forEach((cookie) => {
            const data = StoragePlugin.formatCookieInfo(cookie, 'remove');
            StoragePlugin.sendStorageItem(data);
          });
        }
      });
    } else {
      document.cookie.split('; ').forEach((item) => {
        const [name, value] = item.split('=');
        StoragePlugin.sendStorageItem({
          type: 'cookie',
          action: 'get',
          name,
          value,
        });
      });
    }
  }

  private static listenRefreshEvent() {
    socketStore.addListener(DEBUG_MESSAGE_TYPE.REFRESH, ({ source }) => {
      const { data } = source;
      switch (data) {
        case 'localStorage':
          StoragePlugin.takeLocalStorage();
          break;
        case 'sessionStorage':
          StoragePlugin.takeSessionStorage();
          break;
        case 'cookie':
          StoragePlugin.takeCookie();
          break;
        default:
          break;
      }
    });
  }

  private static formatCookieInfo(
    cookie: CookieStoreValue,
    action: SpyStorage.ActionType = 'get',
  ) {
    const result: Omit<SpyStorage.DataItem, 'id'> = {
      type: 'cookie',
      action,
      ...cookie,
    };
    if (!result.domain) {
      result.domain = window.location.hostname;
    }
    return result;
  }

  private static sendStorageItem(info: Omit<SpyStorage.DataItem, 'id'>) {
    const data = makeMessage(DEBUG_MESSAGE_TYPE.STORAGE, info);
    socketStore.broadcastMessage(data);
  }

  private static initStorageProxy() {
    const { getStorageType, sendStorageItem } = StoragePlugin;
    const { clear, removeItem, setItem } = Storage.prototype;

    Storage.prototype.clear = function () {
      const action = 'clear';
      const type = getStorageType(this);
      clear.call(this);
      sendStorageItem({ type, action });
    };
    Storage.prototype.removeItem = function (name: string) {
      const action = 'remove';
      const type = getStorageType(this);
      removeItem.call(this, name);
      sendStorageItem({ type, action, name: String(name) });
    };
    Storage.prototype.setItem = function (name: string, value: string) {
      const action = 'set';
      const type = getStorageType(this);
      setItem.call(this, name, value);
      sendStorageItem({
        type,
        action,
        name: String(name),
        value: String(value),
      });
    };
  }

  private static getStorageType(ins: Storage): SpyStorage.DataType {
    if (ins === localStorage) return 'localStorage';
    if (ins === sessionStorage) return 'sessionStorage';
    return ins.constructor.name as any;
  }
}
