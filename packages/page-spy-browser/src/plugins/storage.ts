import { makeMessage } from '@huolala-tech/page-spy-base';
import {
  SpyStorage,
  PageSpyPlugin,
  OnInitParams,
} from '@huolala-tech/page-spy-types';
import socketStore from '../helpers/socket';
import { InitConfig } from '../config';

export class StoragePlugin implements PageSpyPlugin {
  public name = 'StoragePlugin';

  public static hasInitd = false;

  public originSetItem: Storage['setItem'] | null = null;

  public originRemoveItem: Storage['removeItem'] | null = null;

  public originClear: Storage['clear'] | null = null;

  public cookieStoreChangeListener: ((evt: Event) => void) | null = null;

  public $pageSpyConfig: InitConfig | null = null;

  public onInit({ config }: OnInitParams<InitConfig>) {
    if (StoragePlugin.hasInitd) return;
    StoragePlugin.hasInitd = true;

    this.$pageSpyConfig = config;

    this.listenRefreshEvent();
    this.onceInitPublicData();
    this.initStorageProxy();
    socketStore.addListener('harbor-clear', () => {
      this.onceInitPublicData();
    });
  }

  public onReset() {
    if (this.originClear) {
      Storage.prototype.clear = this.originClear;
    }
    if (this.originRemoveItem) {
      Storage.prototype.removeItem = this.originRemoveItem;
    }
    if (this.originSetItem) {
      Storage.prototype.setItem = this.originSetItem;
    }
    if (this.cookieStoreChangeListener && window.cookieStore) {
      window.cookieStore.removeEventListener(
        'change',
        this.cookieStoreChangeListener,
      );
    }
    StoragePlugin.hasInitd = false;
  }

  async sendRefresh(type: string) {
    let result: SpyStorage.GetTypeDataItem | null = null;

    switch (type) {
      case 'localStorage':
      case 'sessionStorage':
        result = this.takeStorage(type);
        break;
      case 'cookie':
        result = await this.takeCookie();
        break;
      /* c8 ignore next 2 */
      default:
        break;
    }

    if (result) {
      this.sendStorageItem(result);
    }
  }

  public listenRefreshEvent() {
    /* c8 ignore next 5 */
    socketStore.addListener('refresh', async ({ source }) => {
      /* c8 ignore next 3 */
      const { data } = source;
      this.sendRefresh(data);
    });
  }

  public takeStorage(type: 'localStorage' | 'sessionStorage') {
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

  public async takeCookie() {
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

  public initStorageProxy() {
    const { clear, removeItem, setItem } = Storage.prototype;
    this.originClear = clear;
    this.originRemoveItem = removeItem;
    this.originSetItem = setItem;

    const that = this;
    Storage.prototype.clear = function () {
      clear.call(this);
      const data = {
        type: that.getStorageType(this),
        action: 'clear',
      } as const;
      that.sendStorageItem(data);
    };
    Storage.prototype.removeItem = function (name: string) {
      removeItem.call(this, name);
      const data = {
        type: that.getStorageType(this),
        action: 'remove',
        name: String(name),
      } as const;
      that.sendStorageItem(data);
    };
    Storage.prototype.setItem = function (name: string, value: string) {
      setItem.call(this, name, value);
      const data = {
        type: that.getStorageType(this),
        action: 'set',
        name: String(name),
        value: String(value),
      } as const;
      that.sendStorageItem(data);
    };

    if (window.cookieStore) {
      this.cookieStoreChangeListener = (e: Event) => {
        const { changed, deleted } = e as CookieChangeEvent;
        if (changed.length > 0) {
          changed.forEach((cookie) => {
            const data = {
              type: 'cookie',
              action: 'set',
              ...cookie,
            } as const;
            this.sendStorageItem(data);
          });
        }
        if (deleted.length > 0) {
          deleted.forEach((cookie) => {
            const data = {
              type: 'cookie',
              action: 'remove',
              name: cookie.name,
            } as const;
            this.sendStorageItem(data);
          });
        }
      };
      window.cookieStore.addEventListener(
        'change',
        this.cookieStoreChangeListener,
      );
    }
  }

  // For statistics plugin
  async onceInitPublicData() {
    const result = await Promise.all([
      this.takeStorage('localStorage'),
      this.takeStorage('sessionStorage'),
      this.takeCookie(),
    ]);
    result.forEach((s) => {
      const processedByUser = this.$pageSpyConfig?.dataProcessor?.storage?.(
        s as any,
      );
      if (processedByUser === false) return;

      const data = makeMessage('storage', s);
      socketStore.dispatchEvent('public-data', data);
    });
  }

  public getStorageType(ins: Storage): SpyStorage.DataType {
    if (ins === localStorage) return 'localStorage';
    if (ins === sessionStorage) return 'sessionStorage';
    return ins.constructor.name as any;
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
