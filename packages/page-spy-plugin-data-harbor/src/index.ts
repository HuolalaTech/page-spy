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
  isString,
  psLog,
  RequestItem,
} from '@huolala-tech/page-spy-base';
import { Harbor } from './harbor';
import { DownloadArgs, handleDownload, startDownload } from './utils/download';
import { UploadArgs, handleUpload, startUpload } from './utils/upload';
import { getDeviceId, makeData } from './utils';

type DataType = 'console' | 'network' | 'system' | 'storage' | 'rrweb-event';

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

  // By default, multiple calls to `window.$harbor.markAndFlush` within 1 minute
  // will only trigger one upload. This parameter specifies the upload interval.
  throttleTimeOfMarkLog?: number;
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
  throttleTimeOfMarkLog: 60 * 1000,
};

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

    this.harbor = new Harbor({ maximum: config.maximum });
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
      this.apiBase = `${apiScheme}${api}`;
    }

    socketStore.addListener('public-data', async (message) => {
      if (!this.isCaredPublicData(message)) return;

      const data = makeData(message.type, message.data);
      this.pageLogQueue.push(data);

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
    const { onDownload, filename } = this.$harborConfig;
    if (type === 'download') {
      return {
        harbor: this.harbor,
        filename,
        customDownload: onDownload,
      };
    }
    return {
      harbor: this.harbor,
      uploadUrl: this.apiBase,
      filename,
      debugClient: this.$pageSpyConfig?.clientOrigin!,
      tags: {
        project: this.$pageSpyConfig?.project,
        title: this.$pageSpyConfig?.title,
        deviceId: getDeviceId(),
        userAgent: navigator.userAgent,
      },
    } as UploadArgs;
  }

  // eslint-disable-next-line consistent-return
  async onOfflineLog(type: 'download' | 'upload') {
    try {
      switch (type) {
        case 'download':
          startDownload(this.getParams('download'));
          break;
        case 'upload':
          const url = await startUpload(this.getParams('upload'));
          return url;
        default:
          break;
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

  public pageId = getRandomId();

  public pageLogQueue: ReturnType<typeof makeData>[] = [];

  public pageLogThrottleTimer: ReturnType<typeof setTimeout> | null = null;

  // During offline log recording, users can call this method to mark custom events.
  // For example, when the program encounters an error, calling
  // `window.$harbor.markAndFlush('error')` will insert `{type: 'mark', data: 'error'}`
  // into the log queue, upload the current log list fragment, and start a new log queue.
  // The default value "dida", think it as water droplets 😄
  public markAndFlush(data: string = 'dida') {
    this.pageLogQueue.push(makeData('mark', data));
    if (this.pageLogThrottleTimer) return;

    try {
      if (!isString(data)) {
        data = JSON.stringify(data);
      }
    } catch (e) {
      data = data.toString();
    }
    this.pageLogThrottleTimer = setTimeout(() => {
      // TODO 上传日志
      this.pageLogQueue = [];
      this.pageLogThrottleTimer = null;
    }, this.$harborConfig.throttleTimeOfMarkLog);
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
}
