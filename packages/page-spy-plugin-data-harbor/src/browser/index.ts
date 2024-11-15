/* eslint-disable consistent-return */
import type {
  SpyMessage,
  OnInitParams,
  PageSpyPlugin,
  PluginOrder,
  InitConfigBase,
  OnMountedParams,
} from '@huolala-tech/page-spy-types';
import {
  psLog,
  removeEndSlash,
  RequestItem,
  SocketStoreBase,
} from '@huolala-tech/page-spy-base';
import {
  BlobHarbor,
  DEFAULT_MAXIMUM,
  DEFAULT_PERIOD_DURATION,
  PERIOD_DIVIDE_IDENTIFIER,
} from '../harbor/blob';
import { DownloadArgs, startDownload } from '../utils/download';
import { UploadArgs, startUpload } from '../utils/upload';
import { getDeviceId, isValidPeriod, jsonToFile, makeData } from '../utils';
import {
  Actions,
  CacheMessageItem,
  DataType,
  isPeriodActionParams,
  isPeriodItem,
  PeriodActionParams,
  WholeActionParams,
} from '../harbor/base';
import { buildModal } from './modal';

interface DataHarborConfig {
  // Specify the maximum bytes of single harbor's container.
  // Default 10 * 1024 * 1024, 10MB.
  // If a period is specified, it will use the period.
  maximum?: number;

  // Set the duration of each period in milliseconds.
  // Default is 5 * 60 * 1000, 5 minutes.
  // Valid time range is 1 minute to 30 minutes.
  period?: number;

  // Specify which types of data to collect.
  caredData?: Record<Exclude<DataType, 'meta'>, boolean>;

  // Custom uploaded filename by this.
  // Default value is `new Date().toLocaleString()`.
  filename?: () => string;

  // Custom download behavior.
  onDownload?: ((data: CacheMessageItem[]) => void) | null;
}

const defaultConfig: Required<DataHarborConfig> = {
  maximum: DEFAULT_MAXIMUM,
  period: DEFAULT_PERIOD_DURATION,
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
  onDownload: null,
};

export default class DataHarborPlugin implements PageSpyPlugin {
  public enforce: PluginOrder = 'pre';

  public name = 'DataHarborPlugin';

  // "Harbor" is an abstraction for scheduling data actions.
  public harbor: BlobHarbor;

  public apiBase: string = '';

  public isPaused = false;

  public startTimestamp = 0;

  private periodTimer: ReturnType<typeof setInterval> | null = null;

  public $socketStore: SocketStoreBase | null = null;

  public $pageSpyConfig: InitConfigBase | null = null;

  public $harborConfig: Required<DataHarborConfig>;

  public static hasInited = false;

  public static hasMounted = false;

  constructor(config?: DataHarborConfig) {
    this.$harborConfig = {
      ...defaultConfig,
      ...config,
    } as Required<DataHarborConfig>;

    if (!isValidPeriod(this.$harborConfig.period)) {
      this.$harborConfig.period = defaultConfig.period;
    }

    this.harbor = new BlobHarbor({
      maximum: this.$harborConfig.maximum,
    });
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

    this.initPeriodTimer();

    this.$socketStore.addListener('public-data', (message) => {
      if (this.isPaused || !this.isCaredPublicData(message)) return;

      const data = makeData(message.type as DataType, message.data);
      if (!this.startTimestamp) {
        this.startTimestamp = data.timestamp;
      }

      const ok = this.harbor.add(data);
      if (!ok) {
        psLog.warn(`[${this.name}] Fail to save data in harbor `, data);
      }
    });
  }

  private initPeriodTimer() {
    if (this.periodTimer) {
      clearInterval(this.periodTimer);
    }
    this.periodTimer = setInterval(() => {
      this.harbor.add(PERIOD_DIVIDE_IDENTIFIER);
      // Notify other plugins to resend a full snapshot.
      this.$socketStore?.dispatchEvent('harbor-clear', null);
    }, this.$harborConfig.period);
  }

  public onMounted({ modal, toast }: OnMountedParams<InitConfigBase>) {
    if (DataHarborPlugin.hasMounted) return;
    DataHarborPlugin.hasMounted = true;

    if (modal && toast) {
      buildModal({
        plugin: this,
        modal,
        toast,
      });
    }
  }

  getParams(type: 'upload', params: WholeActionParams): Promise<UploadArgs>;
  getParams(type: 'download'): Promise<DownloadArgs>;
  // prettier-ignore
  getParams(type: 'upload-periods', params: PeriodActionParams): Promise<UploadArgs>;
  // prettier-ignore
  getParams(type: 'download-periods', params: PeriodActionParams): Promise<DownloadArgs>;
  async getParams(
    type: Actions,
    params?: WholeActionParams | PeriodActionParams,
  ) {
    const isPeriods = ['upload-periods', 'download-periods'].includes(type);

    let data: CacheMessageItem[];
    if (isPeriods && isPeriodActionParams(params)) {
      data = await this.harbor.getPeriodData(params);
      data.push(
        makeData('meta', {
          title: document.title,
          url: window.location.href,
          startTime: params.startTime,
          endTime: params.endTime,
          remark: params.remark,
        }),
      );
    } else {
      data = await this.harbor.getAll();
    }

    const { onDownload, filename } = this.$harborConfig;
    if (type === 'download' || type === 'download-periods') {
      return {
        data,
        filename,
        customDownload: onDownload,
      } as DownloadArgs;
    }

    const { project = '', title = '' } = this.$pageSpyConfig || {};
    const tags = {
      project,
      title,
      deviceId: getDeviceId(),
      userAgent: navigator.userAgent,
      remark: params?.remark ?? '',
    };
    if (type === 'upload' || type === 'upload-periods') {
      const file = jsonToFile(data, filename());
      const form = new FormData();
      form.append('log', file);
      return {
        url: `${this.apiBase}/api/v1/log/upload?${new URLSearchParams(tags).toString()}`,
        body: form,
      } as UploadArgs;
    }
  }

  onOfflineLog(type: 'upload', params?: WholeActionParams): Promise<string>;
  onOfflineLog(type: 'download', params?: WholeActionParams): Promise<void>;
  // prettier-ignore
  onOfflineLog(type: 'upload-periods', params: PeriodActionParams): Promise<string>;
  // prettier-ignore
  onOfflineLog(type: 'download-periods', params: PeriodActionParams): Promise<void>;
  async onOfflineLog(
    type: Actions,
    params: WholeActionParams | PeriodActionParams = {
      clearCache: true,
      remark: '',
    },
  ): Promise<void | string> {
    const validatePeriodParams = (p: PeriodActionParams) => {
      if (!p || ![p.fromPeriod, p.toPeriod].every(isPeriodItem)) {
        throw new Error(
          `Incorrect params when you call onOfflineLog('${type}')`,
        );
      }
    };

    let result;
    if (type === 'upload' || type === 'download') {
      const args: any = await this.getParams(type as any, params);
      result =
        type === 'upload' ? await startUpload(args) : await startDownload(args);

      if ((params as WholeActionParams).clearCache === true) {
        this.clearAndNotify();
      }
    }
    if (type === 'upload-periods' || type === 'download-periods') {
      validatePeriodParams(params as PeriodActionParams);
      const args: any = await this.getParams(type as any, params);
      result =
        type === 'upload-periods'
          ? await startUpload(args)
          : await startDownload(args);
    }

    if (result) {
      return this.getDebugUrl(result);
    }
  }

  onReset() {
    if (this.periodTimer) {
      clearInterval(this.periodTimer);
      this.periodTimer = null;
    }
    this.clearAndNotify(false);
    DataHarborPlugin.hasInited = false;
    DataHarborPlugin.hasMounted = false;
    // TODO
  }

  public pause() {
    this.isPaused = true;
  }

  public resume() {
    this.isPaused = false;
  }

  // Drop data in harbor and re-record
  public reharbor() {
    this.initPeriodTimer();
    this.clearAndNotify();
    if (this.isPaused) {
      this.isPaused = false;
    }
  }

  public clearAndNotify(notify = true) {
    this.harbor.clear();
    this.startTimestamp = 0;
    if (notify) {
      this.$socketStore?.dispatchEvent('harbor-clear', null);
    }
  }

  public isCaredPublicData(message: SpyMessage.MessageItem) {
    if (!message) return false;
    const { type } = message;
    const { caredData } = this.$harborConfig;
    switch (type) {
      case 'console':
      case 'storage':
      case 'system':
      case 'rrweb-event':
        return caredData[type];
      case 'network':
        const { url } = message.data as RequestItem;
        const isFetchHarborStockUrl = this.harbor.stock.includes(url);

        if (caredData.network && !isFetchHarborStockUrl) return true;
        return false;
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
