import { makeMessage, MESSAGE_TYPE } from 'src/utils/message';
import type { SpyStorage } from 'types';
import type PageSpyPlugin from './index';
import socketStore from '../utils/socket';

export class StoragePlugin implements PageSpyPlugin {
  name = 'StoragePlugin';

  // eslint-disable-next-line class-methods-use-this
  onCreated() {
    const { sendStorageItem, initStorageProxy } = StoragePlugin;
    const local = { ...localStorage };
    Object.keys(local).forEach((key) => {
      const value = local[key];
      sendStorageItem({ type: 'local', action: 'get', key, value });
    });

    const session = { ...sessionStorage };
    Object.keys(session).forEach((key) => {
      const value = session[key];
      sendStorageItem({ type: 'session', action: 'get', key, value });
    });

    document.cookie.split('; ').forEach((item) => {
      const [key, value] = item.split('=');
      sendStorageItem({
        type: 'cookie',
        action: 'get',
        key,
        value,
      });
    });
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
    Storage.prototype.removeItem = function (key: string) {
      const action = 'remove';
      const type = getStorageType(this);
      sendStorageItem({ type, action, key });
      return removeItem.call(this, key);
    };
    Storage.prototype.setItem = function (key: string, value: string) {
      const action = 'set';
      const type = getStorageType(this);
      sendStorageItem({ type, action, key, value });
      return setItem.call(this, key, value);
    };
  }

  static sendStorageItem({
    type,
    action,
    key = '',
    value = '',
  }: SpyStorage.DataItem) {
    const data = makeMessage(MESSAGE_TYPE.storage, {
      type,
      action,
      key,
      value,
    });
    socketStore.broadcastMessage(data);
  }

  static getStorageType(ins: Storage): SpyStorage.DataType {
    if (ins === localStorage) return 'local';
    if (ins === sessionStorage) return 'session';
    return ins.constructor.name as any;
  }
}
