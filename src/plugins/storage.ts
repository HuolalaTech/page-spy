import { makeMessage, DEBUG_MESSAGE_TYPE } from 'src/utils/message';
import type { SpyStorage } from 'types';
import type PageSpyPlugin from './index';
import socketStore from '../utils/socket';

export class StoragePlugin implements PageSpyPlugin {
  name = 'StoragePlugin';

  // eslint-disable-next-line class-methods-use-this
  onCreated() {
    const { sendStorageItem, initStorageProxy } = StoragePlugin;
    const local = { ...localStorage };
    Object.keys(local).forEach((name) => {
      const value = local[name];
      sendStorageItem({ type: 'local', action: 'get', name, value });
    });

    const session = { ...sessionStorage };
    Object.keys(session).forEach((name) => {
      const value = session[name];
      sendStorageItem({ type: 'session', action: 'get', name, value });
    });

    if (window.cookieStore) {
      const sendCookie = () => {
        window.cookieStore.getAll().then((cookies) => {
          cookies.forEach((cookie) => {
            const data = { type: 'cookie', action: 'get', ...cookie } as Omit<
              SpyStorage.DataItem,
              'id'
            >;
            if (!data.domain) {
              data.domain = window.location.hostname;
            }
            sendStorageItem(data);
          });
        });
      };
      sendCookie();
      window.cookieStore.addEventListener('change', sendCookie);
    } else {
      document.cookie.split('; ').forEach((item) => {
        const [name, value] = item.split('=');
        sendStorageItem({
          type: 'cookie',
          action: 'get',
          name,
          value,
        });
      });
    }

    initStorageProxy();
  }

  static initStorageProxy() {
    const { getStorageType, sendStorageItem } = StoragePlugin;
    const { clear, removeItem, setItem } = Storage.prototype;

    Storage.prototype.clear = function () {
      const action = 'clear';
      const type = getStorageType(this);
      sendStorageItem({ type, action });
      return clear.call(this);
    };
    Storage.prototype.removeItem = function (name: string) {
      const action = 'remove';
      const type = getStorageType(this);
      sendStorageItem({ type, action, name });
      return removeItem.call(this, name);
    };
    Storage.prototype.setItem = function (name: string, value: string) {
      const action = 'set';
      const type = getStorageType(this);
      sendStorageItem({ type, action, name, value });
      return setItem.call(this, name, value);
    };
  }

  static sendStorageItem(info: Omit<SpyStorage.DataItem, 'id'>) {
    const data = makeMessage(DEBUG_MESSAGE_TYPE.STORAGE, info);
    socketStore.broadcastMessage(data);
  }

  static getStorageType(ins: Storage): SpyStorage.DataType {
    if (ins === localStorage) return 'local';
    if (ins === sessionStorage) return 'session';
    return ins.constructor.name as any;
  }
}
