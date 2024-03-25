import {
  SpyMessage,
  OnInitParams,
  OnMountedParams,
  PageSpyPlugin,
  PluginOrder,
} from '@huolala-tech/page-spy-types';
import { PUBLIC_DATA } from 'base/src/message/debug-type';
import { isBrowser, isPlainObject, psLog } from 'base/src';
import { DEBUG_MESSAGE_TYPE } from 'base/src/message';
import { strFromU8, zlibSync, strToU8 } from 'fflate';
import type RequestItem from 'base/src/request-item';
import type { InitConfig } from 'page-spy-browser/types';
import { Harbor } from './harbor';
import { handleDownload, startDownload } from './utils/download';
import { handleUpload, startUpload } from './utils/upload';

type DataType = 'console' | 'network' | 'system' | 'storage' | 'rrweb-event';

export type CacheMessageItem = Pick<
  SpyMessage.MessageItem<SpyMessage.DataType, any>,
  'type' | 'data'
> & {
  timestamp: number;
};

interface DataHarborConfig {
  maximum?: number;
  caredData?: Record<DataType, boolean>;
  filename?: () => string;
  onDownload?: (data: CacheMessageItem[]) => void;
}

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

export default class DataHarborPlugin implements PageSpyPlugin {
  public enforce: PluginOrder = 'pre';

  public name = 'DataHarborPlugin';

  // "Harbor" is an abstraction for scheduling data actions.
  private harbor: Harbor;

  // Specify which types of data to collect.
  private caredData: Record<DataType, boolean> = {
    console: true,
    network: true,
    storage: true,
    system: true,
    'rrweb-event': true,
  };

  private apiBase: string = '';

  private debugClient: string = '';

  private filename: DataHarborConfig['filename'] = () => {
    return new Date().toLocaleString().replace(/\s/g, '_');
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
    if (typeof config.filename === 'function') {
      this.filename = config.filename;
    }
    this.harbor = new Harbor({ maximum: config.maximum });
  }

  public async onInit({ socketStore, config }: OnInitParams) {
    if (DataHarborPlugin.hasInited) return;
    DataHarborPlugin.hasInited = true;

    const { api, enableSSL } = config;
    if (!api) {
      psLog.warn(
        'Cannot upload log to PageSpy for wrong configuration. See: ',
        config,
      );
    } else {
      const apiScheme = enableSSL ? 'https://' : 'http://';
      this.apiBase = `${apiScheme}${api}`;
      this.debugClient = (config as InitConfig).clientOrigin || '';
    }

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

    if (isBrowser()) {
      const downloadBtn = handleDownload({
        harbor: this.harbor,
        filename: this.filename!,
        customDownload: this.onDownload,
      });
      const uploadBtn = handleUpload({
        harbor: this.harbor,
        filename: this.filename!,
        uploadUrl: this.apiBase,
        debugClient: this.debugClient,
      });

      content.insertAdjacentElement('beforeend', downloadBtn);
      content.insertAdjacentElement('beforeend', uploadBtn);
    }
  }

  onOfflineLog(type: 'download' | 'upload') {
    switch (type) {
      case 'download':
        startDownload({
          harbor: this.harbor,
          filename: this.filename!,
          customDownload: this.onDownload,
        });
        break;
      case 'upload':
        startUpload({
          harbor: this.harbor,
          uploadUrl: this.apiBase,
          filename: this.filename!,
          debugClient: this.debugClient,
        });
        break;
      default:
        break;
    }
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
      case DEBUG_MESSAGE_TYPE.CONSOLE:
        if (this.caredData.console) return true;
        return false;
      case DEBUG_MESSAGE_TYPE.STORAGE:
        if (this.caredData.storage) return true;
        return false;
      case DEBUG_MESSAGE_TYPE.SYSTEM:
        if (this.caredData.system) return true;
        return false;
      case DEBUG_MESSAGE_TYPE.RRWEB_EVENT:
        if (this.caredData['rrweb-event']) return true;
        return false;
      case DEBUG_MESSAGE_TYPE.NETWORK:
        const { url } = message.data as RequestItem;
        const isFetchHarborStockUrl = this.harbor.stock.includes(url);

        if (this.caredData.network && !isFetchHarborStockUrl) return true;
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
