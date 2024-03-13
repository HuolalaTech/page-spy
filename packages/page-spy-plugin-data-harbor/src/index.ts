import {
  SpyMessage,
  OnInitParams,
  OnMountedParams,
  PageSpyPlugin,
  PluginOrder,
} from '@huolala-tech/page-spy-types';
import { PUBLIC_DATA } from 'base/src/message/debug-type';
import { isCN, isPlainObject, psLog } from 'base/src';
import { DEBUG_MESSAGE_TYPE } from 'base/src/message';
import { strFromU8, zlibSync, strToU8 } from 'fflate';
import type RequestItem from 'base/src/request-item';
import { Harbor } from './harbor';
// import { SKIP_PUBLIC_IDB_PREFIX } from './skip-public';

type DataType = 'console' | 'network' | 'rrweb-event';

type CacheMessageItem = Pick<
  SpyMessage.MessageItem<SpyMessage.DataType, any>,
  'type' | 'data'
> & {
  timestamp: number;
};

const minifyData = (d: any) => {
  return strFromU8(zlibSync(strToU8(JSON.stringify(d)), { level: 9 }), true);
};

const makeData = (type: SpyMessage.DataType, data: any) => {
  return {
    type,
    timestamp: Date.now(),
    data: minifyData(data),
  };
};

interface DataHarborConfig {
  maximum?: number;
  caredData?: Record<DataType, boolean>;
  onDownload?: (data: CacheMessageItem[]) => void;
}

export default class DataHarborPlugin implements PageSpyPlugin {
  public enforce: PluginOrder = 'pre';

  public name = 'DataHarborPlugin';

  // "Harbor" is an abstraction for scheduling data actions.
  private harbor: Harbor;

  // Specify which types of data to collect.
  private caredData = {
    console: true,
    network: true,
    'rrweb-event': true,
  };

  private onDownload: DataHarborConfig['onDownload'];

  public static hasInited = false;

  public static hasMounted = false;

  constructor(config: DataHarborConfig = {}) {
    if (isPlainObject(config.caredData)) {
      this.caredData = {
        ...this.caredData,
        ...config.caredData,
      };
    }
    if (typeof config.onDownload === 'function') {
      this.onDownload = config.onDownload;
    }
    this.harbor = new Harbor({ maximum: config.maximum });
  }

  public async onInit({ socketStore }: OnInitParams) {
    if (DataHarborPlugin.hasInited) return;
    DataHarborPlugin.hasInited = true;

    socketStore.addListener(PUBLIC_DATA, async (message) => {
      if (!this.isCaredPublicData(message)) return;

      const data = makeData(message.type, message.data);

      const ok = this.harbor.save(data);
      if (!ok) {
        psLog.warn(`[${this.name}] Save data failed`, data);
      }
    });
  }

  public onMounted({ content }: OnMountedParams) {
    if (DataHarborPlugin.hasMounted) return;
    DataHarborPlugin.hasMounted = true;

    const cn = isCN();
    const div = document.createElement('div');
    div.id = 'data-harbor-plugin-download';
    div.className = 'page-spy-content__btn';
    div.textContent = cn ? '下载日志数据' : 'Download the data';

    let idle = true;

    div.addEventListener('click', async () => {
      if (!idle) return;
      idle = false;

      try {
        div.textContent = cn ? '准备数据...' : 'Handling data...';
        const data = await this.harbor.getHarborData();
        if (this.onDownload) {
          div.textContent = cn ? '数据已处理完成' : 'Data is ready';
          await this.onDownload(data);
          return;
        }

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
        div.textContent = cn ? '下载成功' : 'Download successful';
      } catch (e) {
        div.textContent = cn ? '下载失败' : 'Download failed';
        psLog.error('Download failed.', e);
      } finally {
        setTimeout(() => {
          div.textContent = cn ? '下载日志数据' : 'Download the data';
          idle = true;
        }, 3000);
      }
    });

    content.insertAdjacentElement('beforeend', div);
  }

  onReset() {
    this.harbor.clear();
    DataHarborPlugin.hasInited = false;
    DataHarborPlugin.hasMounted = false;
    const node = document.getElementById('data-harbor-plugin-download');
    if (node) {
      node.remove();
    }
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
        const { url } = message.data as RequestItem;
        const isFetchHarborStockUrl = this.harbor.stock.includes(url);

        if (this.caredData.network && !isFetchHarborStockUrl) return true;
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
