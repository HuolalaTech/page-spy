import {
  SpyMessage,
  OnInitParams,
  OnMountedParams,
  PageSpyPlugin,
  PluginOrder,
} from '@huolala-tech/page-spy-types';
import { PUBLIC_DATA } from 'base/src/message/debug-type';
import { isCN, isNumber, isPlainObject, isString, psLog } from 'base/src';
import { DEBUG_MESSAGE_TYPE } from 'base/src/message';
import { strFromU8, zlibSync, strToU8 } from 'fflate';
import { Harbor, SaveAs } from './harbor';
import { IDB_ERROR_COUNT } from './harbor/idb-container';
// import { SKIP_PUBLIC_IDB_PREFIX } from './skip-public';

type DataType = 'console' | 'network' | 'rrweb-event';

interface DataHarborConfig {
  maximum?: number;
  saveAs?: SaveAs;
  caredData?: Record<DataType, boolean>;
}

type CacheMessageItem = Pick<
  SpyMessage.MessageItem<SpyMessage.DataType, any>,
  'type' | 'data'
> & {
  timestamp: number;
};

const minifyData = (d: any) => {
  return strFromU8(zlibSync(strToU8(JSON.stringify(d)), { level: 9 }), true);
};

export default class DataHarborPlugin implements PageSpyPlugin {
  public enforce: PluginOrder = 'pre';

  public name = 'DataHarborPlugin';

  // "Harbor" is an abstraction for scheduling data actions.
  private harbor: Harbor | null = null;

  private harborIsReady = false;

  private waitForFillHarbor: CacheMessageItem[] = [];

  // Specify the place to save data.
  private saveAs: SaveAs = 'indexedDB';

  // Specify the maximum number of data entries for caching.
  // Default no limitation.
  private maximum = 0;

  // Specify which types of data to collect.
  private caredData = {
    console: true,
    network: true,
    'rrweb-event': true,
  };

  public static hasInited = false;

  public static hasMounted = false;

  constructor(config: DataHarborConfig = {}) {
    if (isNumber(config.maximum) && config.maximum >= 0) {
      this.maximum = config.maximum;
    }
    if (isString(config.saveAs)) {
      this.saveAs = config.saveAs;
    }
    if (isPlainObject(config.caredData)) {
      this.caredData = {
        ...this.caredData,
        ...config.caredData,
      };
    }
    this.initHarbor();
  }

  public async onInit({ socketStore }: OnInitParams) {
    if (DataHarborPlugin.hasInited) return;
    DataHarborPlugin.hasInited = true;

    socketStore.addListener(PUBLIC_DATA, async (message) => {
      if (!this.isCaredPublicData(message)) return;

      const timestamp = Date.now();
      const data = {
        type: message.type,
        timestamp,
        data: minifyData(message.data),
      };

      if (!this.harbor || !this.harborIsReady) {
        this.waitForFillHarbor.push(data);
        return;
      }

      const count = await this.harbor.container.count();
      if (count === IDB_ERROR_COUNT) return;
      if (this.maximum !== 0 && count > this.maximum) {
        return;
      }

      await this.harbor.container.add(data);
    });
  }

  public onMounted({ content }: OnMountedParams) {
    if (DataHarborPlugin.hasMounted) return;
    DataHarborPlugin.hasMounted = true;

    const div = document.createElement('div');
    div.id = 'data-harbor-plugin-download';
    div.className = 'page-spy-content__btn';
    div.textContent = isCN() ? '下载日志数据' : 'Download the data';

    div.addEventListener('click', async () => {
      const data = await this.harbor?.container.getAll();
      const blob = new Blob([JSON.stringify(data)], {
        type: 'application/json',
      });
      const root: HTMLElement =
        document.getElementsByTagName('body')[0] || document.documentElement;
      if (!root) {
        psLog.error(
          'Download file failed because cannot find the document.body & document.documentElement',
        );
        return;
      }
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.download = `${new Date().toLocaleString()}.json`;
      a.href = url;
      a.style.display = 'none';
      root.insertAdjacentElement('beforeend', a);
      a.click();

      root.removeChild(a);
      URL.revokeObjectURL(url);
    });

    content.insertAdjacentElement('beforeend', div);
  }

  onReset() {
    DataHarborPlugin.hasInited = false;
    DataHarborPlugin.hasMounted = false;
    const node = document.getElementById('data-harbor-plugin-download');
    if (node) {
      node.remove();
    }
  }

  private async initHarbor() {
    this.harbor = new Harbor({ saveAs: this.saveAs });
    await this.harbor.container.drop();
    await this.harbor.container.init();
    if (this.waitForFillHarbor.length) {
      const task = this.waitForFillHarbor.map((data) => {
        return this.harbor?.container.add(data);
      });
      await Promise.all(task);
    }
    this.waitForFillHarbor = [];
    this.harborIsReady = true;
  }

  private isCaredPublicData(message: SpyMessage.MessageItem) {
    if (!message) return false;
    const { type } = message;
    switch (type) {
      // case DEBUG_MESSAGE_TYPE.STORAGE:
      case DEBUG_MESSAGE_TYPE.CONSOLE:
        if (this.caredData.console) return true;
        return false;
      case DEBUG_MESSAGE_TYPE.NETWORK:
        if (this.caredData.network) return true;
        return false;
      case DEBUG_MESSAGE_TYPE.RRWEB_EVENT:
        if (this.caredData['rrweb-event']) return true;
        return false;
      // case DEBUG_MESSAGE_TYPE.DATABASE:
      //   if (['update', 'clear', 'drop'].includes(data.action)) {
      //     if (data.database?.includes(SKIP_PUBLIC_IDB_PREFIX)) {
      //       return false;
      //     }
      //     return true;
      //   }
      //   break;
      default:
        return false;
    }
  }
}
