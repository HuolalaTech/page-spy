import type {
  SpyMessage,
  OnInitParams,
  OnMountedParams,
  PageSpyPlugin,
  PluginOrder,
} from '@huolala-tech/page-spy-types';
import { isBrowser, isPlainObject, psLog } from 'base/src';
import { strFromU8, zlibSync, strToU8 } from 'fflate';
import type RequestItem from 'base/src/request-item';
import type { InitConfig } from 'page-spy-browser/types';
import { Harbor } from './harbor';
import { DownloadArgs, handleDownload, startDownload } from './utils/download';
import { UploadArgs, handleUpload, startUpload } from './utils/upload';
import { getDeviceId } from './utils';

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

  private $pageSpyConfig: InitConfig | null = null;

  private filename: DataHarborConfig['filename'] = () => {
    return new Date().toLocaleString();
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

    this.$pageSpyConfig = config;
    const { api, enableSSL } = config;
    if (!api) {
      psLog.warn(
        "Cannot upload log to PageSpy for miss 'api' configuration. See: ",
        config,
      );
    } else {
      const apiScheme = enableSSL ? 'https://' : 'http://';
      this.apiBase = `${apiScheme}${api}`;
    }

    socketStore.addListener('public-data', async (message) => {
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
      const downloadBtn = handleDownload(this.getParams('download'));
      const uploadBtn = handleUpload(this.getParams('upload'));

      content.insertAdjacentElement('beforeend', downloadBtn);
      content.insertAdjacentElement('beforeend', uploadBtn);
    }
  }

  getParams(type: 'download'): DownloadArgs;
  getParams(type: 'upload'): UploadArgs;
  getParams(type: any) {
    if (type === 'download') {
      return {
        harbor: this.harbor,
        filename: this.filename!,
        customDownload: this.onDownload,
      };
    }
    return {
      harbor: this.harbor,
      uploadUrl: this.apiBase,
      filename: this.filename!,
      debugClient: this.$pageSpyConfig?.clientOrigin!,
      tags: {
        project: this.$pageSpyConfig?.project,
        title: this.$pageSpyConfig?.title,
        deviceId: getDeviceId(),
        userAgent: navigator.userAgent,
      },
    } as UploadArgs;
  }

  onOfflineLog(type: 'download' | 'upload') {
    switch (type) {
      case 'download':
        startDownload(this.getParams('download'));
        break;
      case 'upload':
        startUpload(this.getParams('upload'));
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
      case 'console':
        if (this.caredData.console) return true;
        return false;
      case 'storage':
        if (this.caredData.storage) return true;
        return false;
      case 'system':
        if (this.caredData.system) return true;
        return false;
      case 'rrweb-event':
        if (this.caredData['rrweb-event']) return true;
        return false;
      case 'network':
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
