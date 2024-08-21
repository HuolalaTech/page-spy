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
  getRandomId,
  isBrowser,
  isNumber,
  psLog,
  removeEndSlash,
  RequestItem,
} from '@huolala-tech/page-spy-base';
import { Harbor } from './harbor';
import {
  buttonBindWithDownload,
  DownloadArgs,
  startDownload,
} from './utils/download';
import {
  UploadArgs,
  buttonBindWithUpload,
  isGroupLog,
  startUpload,
} from './utils/upload';
import { getDeviceId, jsonToFile, makeData } from './utils';
import { UPLOAD_TIPS } from './utils/TIP_CONTENT';

type DataType = 'console' | 'network' | 'system' | 'storage' | 'rrweb-event';

type FileAction = 'download' | 'upload' | 'upload-fragment' | 'upload-partial';

interface MetricMessage {
  type: 'metric';
  data: any;
}

// See https://github.com/rrweb-io/rrweb/blob/master/packages/types/src/index.ts#L8-L16
enum RRWebEventType {
  DomContentLoaded = 0,
  Load = 1,
  FullSnapshot = 2,
  IncrementalSnapshot = 3,
  Meta = 4,
  Custom = 5,
  Plugin = 6,
}

interface RRWebCheckoutItem {
  indexOfStock: number;
  indexOfContainer: number;
  timestamp: number;
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

let markHarborUploadIdle = true;

export default class DataHarborPlugin implements PageSpyPlugin {
  public enforce: PluginOrder = 'pre';

  public name = 'DataHarborPlugin';

  // "Harbor" is an abstraction for scheduling data actions.
  public harbor: Harbor;

  public apiBase: string = '';

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
    const { api, enableSSL } = config;
    if (!api) {
      psLog.warn(
        "Cannot upload log to PageSpy for miss 'api' configuration. See: ",
        config,
      );
    } else {
      const apiScheme = enableSSL ? 'https://' : 'http://';
      this.apiBase = removeEndSlash(`${apiScheme}${api}`);
    }

    socketStore.addListener('public-data', (message) => {
      if (!this.isCaredPublicData(message)) return;

      const data = makeData(message.type, message.data);

      const ok1 = this.harbor.save(data);
      if (!ok1) {
        psLog.warn(`[${this.name}] Fail to save data in harbor `, data);
      } else {
        this.saveRRWebCheckout(message, data.timestamp);
      }
      if (this.markHarbor) {
        const ok2 = this.markHarbor.save(data);
        if (!ok2) {
          psLog.warn(`[${this.name}] Fail to save data in markHarbor`, data);
        }
      }
    });
  }

  private rrwebCheckouts: RRWebCheckoutItem[] = [];

  private saveRRWebCheckout(
    message: SpyMessage.MessageItem,
    timestamp: number,
  ) {
    if (
      message.type === 'rrweb-event' &&
      message.data.type === RRWebEventType.Meta
    ) {
      this.rrwebCheckouts.push({
        indexOfStock: this.harbor.stock.length,
        indexOfContainer: this.harbor.container.length - 1,
        timestamp,
      });
    }
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
  getParams(type: 'upload-partial'): Promise<UploadArgs>;
  getParams(type: 'upload-fragment', duration: number): Promise<UploadArgs>;
  async getParams(type: FileAction, duration?: number) {
    const { onDownload, filename, maximum } = this.$harborConfig;
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

    if (type === 'upload-partial') {
      let harborData: any;
      if (!this.markHarbor) {
        this.markHarbor = new Harbor({ maximum });
        harborData = await this.harbor.getHarborData();
      } else {
        harborData = await this.markHarbor.getHarborData();
        this.markHarbor.clear();
      }
      const file = jsonToFile(harborData, filename());
      const form = new FormData();
      form.append('log', file);
      return {
        url: `${this.apiBase}/api/v1/logGroup/upload?groupId=${this.groupId}&${new URLSearchParams(tags).toString()}`,
        body: form,
      } as UploadArgs;
    }

    if (type === 'upload-fragment') {
      const now = Date.now();
      const timestamp = now - duration!;
      const matched = this.rrwebCheckouts.findLast(
        (i) => i.timestamp <= timestamp,
      );
      let data;
      if (!matched) {
        data = await this.harbor.getHarborData();
      } else {
        data = await this.harbor.getHarborDataByIndex(
          matched.indexOfStock,
          matched.indexOfContainer,
        );
      }
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
  onOfflineLog(type: 'upload-partial'): Promise<string>;
  onOfflineLog(type: 'upload-fragment', duration: number): Promise<string>;
  async onOfflineLog(
    type: FileAction,
    duration?: number,
  ): Promise<void | string> {
    try {
      if (type === 'download') {
        const downloadArgs = await this.getParams('download');
        startDownload(downloadArgs);
        return;
      }

      if (type === 'upload') {
        const uploadArgs = await this.getParams('upload');
        const result = await startUpload(uploadArgs);
        return this.getDebugUrl(result);
      }

      if (type === 'upload-partial') {
        if (!markHarborUploadIdle) return;
        markHarborUploadIdle = false;

        const uploadArgs = await this.getParams('upload-partial');
        const result = await startUpload(uploadArgs);
        markHarborUploadIdle = true;
        return this.getDebugUrl(result);
      }

      if (type === 'upload-fragment' && isNumber(duration) && duration > 0) {
        const uploadArgs = await this.getParams('upload-fragment', duration);
        const result = await startUpload(uploadArgs);
        return this.getDebugUrl(result);
      }
    } catch (e: any) {
      psLog.error(e.message);
    }
  }

  onReset() {
    this.harbor.clear();
    this.markHarbor?.clear();
    DataHarborPlugin.hasInited = false;
    DataHarborPlugin.hasMounted = false;
    const node = document.getElementById('data-harbor-plugin-download');
    if (node) {
      node.remove();
    }
  }

  public groupId = getRandomId();

  public markHarbor: Harbor | null = null;

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

    if (isGroupLog(result.data)) {
      const filesUrl = `${this.apiBase}/api/v1/logGroup/files?groupId=${result.data.groupId}`;
      return `${debugOrigin}?files=${filesUrl}`;
    }
    const logUrl = `${this.apiBase}/api/v1/log/download?fileId=${result.data.fileId}`;
    return `${debugOrigin}?url=${logUrl}`;
  }
}
