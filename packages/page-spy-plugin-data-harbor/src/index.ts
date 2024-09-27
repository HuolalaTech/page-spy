/* eslint-disable consistent-return */
import type {
  SpyMessage,
  OnInitParams,
  OnMountedParams,
  PageSpyPlugin,
  PluginOrder,
  InitConfigBase,
} from '@huolala-tech/page-spy-types';
import {
  isBrowser,
  psLog,
  removeEndSlash,
  RequestItem,
  SocketStoreBase,
} from '@huolala-tech/page-spy-base';
import { Harbor } from './harbor';
import {
  buttonBindWithDownload,
  DownloadArgs,
  startDownload,
} from './utils/download';
import { UploadArgs, buttonBindWithUpload, startUpload } from './utils/upload';
import { getDeviceId, jsonToFile, makeData } from './utils';
import { UPLOAD_TIPS } from './utils/TIP_CONTENT';

type DataType = 'console' | 'network' | 'system' | 'storage' | 'rrweb-event';

type FileAction = 'download' | 'upload';

interface MetricMessage {
  type: 'metric';
  data: any;
}

export type CacheMessageItem = Pick<
  SpyMessage.MessageItem<SpyMessage.DataType, any>,
  'type' | 'data'
> & {
  timestamp: number;
};

interface DataHarborConfig {
  // Specify the maximum bytes of single harbor's container.
  // Default 10MB.
  maximum?: number;

  // Specify which types of data to collect.
  caredData?: Record<DataType, boolean>;

  // Custom uploaded filename by this.
  // Default value is `new Date().toLocaleString()`.
  filename?: () => string;

  // Custom download behavior.
  onDownload?: (data: CacheMessageItem[]) => void;
}

const defaultConfig: DataHarborConfig = {
  maximum: 10 * 1024 * 1024,
  caredData: {
    console: true,
    network: true,
    storage: true,
    system: true,
    'rrweb-event': true,
  },
  filename: () => {
    return new Date().toLocaleString();
  },
};

export default class DataHarborPlugin implements PageSpyPlugin {
  public enforce: PluginOrder = 'pre';

  public name = 'DataHarborPlugin';

  // "Harbor" is an abstraction for scheduling data actions.
  public harbor: Harbor;

  public apiBase: string = '';

  public $socketStore: SocketStoreBase | null = null;

  public $pageSpyConfig: InitConfigBase | null = null;

  public $harborConfig: Required<DataHarborConfig>;

  public static hasInited = false;

  public static hasMounted = false;

  constructor(config: DataHarborConfig) {
    this.$harborConfig = {
      ...defaultConfig,
      ...config,
    } as Required<DataHarborConfig>;

    this.harbor = new Harbor({ maximum: this.$harborConfig.maximum });
  }

  public async onInit({ socketStore, config }: OnInitParams<InitConfigBase>) {
    if (DataHarborPlugin.hasInited) return;
    DataHarborPlugin.hasInited = true;

    this.$pageSpyConfig = config;
    this.$socketStore = socketStore;

    const { api, enableSSL, offline } = config;
    if (!offline && !api) {
      psLog.warn(
        "Cannot upload log to PageSpy for miss 'api' configuration. See: ",
        config,
      );
    } else {
      const apiScheme = enableSSL ? 'https://' : 'http://';
      this.apiBase = removeEndSlash(`${apiScheme}${api}`);
    }

    this.$socketStore.addListener('public-data', (message) => {
      if (!this.isCaredPublicData(message)) return;

      const data = makeData(message.type, message.data);

      const ok = this.harbor.save(data);
      if (!ok) {
        psLog.warn(`[${this.name}] Fail to save data in harbor `, data);
      }
    });
  }

  public onMounted({ content }: OnMountedParams) {
    if (DataHarborPlugin.hasMounted) return;
    DataHarborPlugin.hasMounted = true;

    if (isBrowser()) {
      const downloadBtn = buttonBindWithDownload(async () => {
        const params = await this.getParams('download');
        startDownload(params);
      });
      const uploadBtn = buttonBindWithUpload(async () => {
        const params = await this.getParams('upload');
        const result = await startUpload(params);
        const debugUrl = this.getDebugUrl(result);
        if (debugUrl) {
          psLog.info(`${UPLOAD_TIPS.success}: ${debugUrl}`);
        }
        return debugUrl;
      });

      content.insertAdjacentElement('beforeend', downloadBtn);
      content.insertAdjacentElement('beforeend', uploadBtn);
    }
  }

  getParams(type: 'download'): Promise<DownloadArgs>;
  getParams(type: 'upload'): Promise<UploadArgs>;
  async getParams(type: FileAction) {
    const { onDownload, filename } = this.$harborConfig;
    const { project = '', title = '' } = this.$pageSpyConfig!;
    const tags = {
      project,
      title,
      deviceId: getDeviceId(),
      userAgent: navigator.userAgent,
    };
    if (type === 'download') {
      return {
        harbor: this.harbor,
        filename,
        customDownload: onDownload,
      } as DownloadArgs;
    }

    if (type === 'upload') {
      const data = await this.harbor.getHarborData();
      const file = jsonToFile(data, filename());
      const form = new FormData();
      form.append('log', file);
      return {
        url: `${this.apiBase}/api/v1/log/upload?${new URLSearchParams(tags).toString()}`,
        body: form,
      } as UploadArgs;
    }
  }

  onOfflineLog(type: 'download'): Promise<void>;
  onOfflineLog(type: 'upload'): Promise<string>;
  async onOfflineLog(type: FileAction): Promise<void | string> {
    try {
      let result;
      if (type === 'download') {
        const downloadArgs = await this.getParams('download');
        await startDownload(downloadArgs);
      }
      if (type === 'upload') {
        const uploadArgs = await this.getParams('upload');
        result = await startUpload(uploadArgs);
      }

      this.harbor.clear();
      this.$socketStore?.dispatchEvent('harbor-clear', null);

      if (result) {
        return this.getDebugUrl(result);
      }
    } catch (e: any) {
      psLog.error(e.message);
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

  public isCaredPublicData(message: SpyMessage.MessageItem | MetricMessage) {
    if (!message) return false;
    const { type } = message;
    const { caredData } = this.$harborConfig;
    switch (type) {
      case 'console':
        if (caredData.console) return true;
        return false;
      case 'storage':
        if (caredData.storage) return true;
        return false;
      case 'system':
        if (caredData.system) return true;
        return false;
      case 'rrweb-event':
        if (caredData['rrweb-event']) return true;
        return false;
      case 'network':
        const { url } = message.data as RequestItem;
        const isFetchHarborStockUrl = this.harbor.stock.includes(url);

        if (caredData.network && !isFetchHarborStockUrl) return true;
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

  getDebugUrl(result: H.UploadResult | null) {
    if (!result || !result.success) return '';

    const debugOrigin = `${removeEndSlash(this.$pageSpyConfig?.clientOrigin!)}/#/replay`;
    const logUrl = `${this.apiBase}/api/v1/log/download?fileId=${result.data.fileId}`;
    return `${debugOrigin}?url=${logUrl}`;
  }
}
