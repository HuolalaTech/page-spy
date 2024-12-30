/* eslint-disable consistent-return */
import type {
  SpyMessage,
  OnInitParams,
  PageSpyPlugin,
  PluginOrder,
  InitConfigBase,
  OnMountedParams,
} from '@huolala-tech/page-spy-types';
import { psLog, removeEndSlash } from '@huolala-tech/page-spy-base/dist/utils';
import type { SocketStoreBase, RequestItem } from '@huolala-tech/page-spy-base';
import {
  BlobHarbor,
  DEFAULT_MAXIMUM,
  PERIOD_DIVIDE_IDENTIFIER,
} from './harbor/blob';
import {
  DownloadArgs,
  startDownload,
  UploadArgs,
  startUpload,
} from './utils/log';
import { getDeviceId, jsonToFile, makeData, minifyData } from './utils';
import {
  Actions,
  CacheMessageItem,
  DataType,
  isPeriodAction,
  isPeriodActionParams,
  PeriodActionParams,
  WholeActionParams,
} from './harbor/base';
import { buildModal } from './utils/modal';
import { t } from './assets/locale';

interface DataHarborConfig {
  // Specify the maximum bytes of single harbor's container.
  // Default 10 * 1024 * 1024, 10MB.
  // If a period is specified, it will use the period.
  maximum?: number;

  // Specify which types of data to collect.
  caredData?: Record<Exclude<DataType, 'meta'>, boolean>;

  // Custom uploaded filename by this.
  // Default value is `new Date().toLocaleString()`.
  filename?: () => string;

  // Custom download behavior.
  onDownload?: ((data: CacheMessageItem[]) => void) | null;

  // Custom behavior after upload.
  onAfterUpload?: ((replayUrl: string, remark: string) => void) | null;
}

const defaultConfig: Required<DataHarborConfig> = {
  maximum: DEFAULT_MAXIMUM,
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
  onAfterUpload: null,
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
    this.periodTimer = setInterval(
      () => {
        this.harbor.add(PERIOD_DIVIDE_IDENTIFIER);
        // Notify other plugins to resend a full snapshot.
        this.$socketStore?.dispatchEvent('harbor-clear', null);
      },
      5 * 60 * 1000,
    );
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
    let data: CacheMessageItem[];
    if (isPeriodAction(type)) {
      if (!isPeriodActionParams(params) || params.startTime > params.endTime) {
        throw new Error(t.invalidParams);
      }
      data = await this.harbor.getPeriodData(params);

      const startTimeFromUser = params.startTime;
      const startTimeFromEvent = data[0].timestamp;
      const validStartTime =
        startTimeFromUser < startTimeFromEvent
          ? startTimeFromEvent
          : startTimeFromUser;
      // If the amount of event data is too small, it will be meaningless.
      const validEventCount = data.filter(
        (i) => i.timestamp >= validStartTime && i.timestamp <= params.endTime,
      ).length;
      if (validEventCount < 5) {
        throw new Error(t.eventCountNotEnough);
      }

      data.push({
        type: 'meta',
        timestamp: params.endTime,
        data: minifyData({
          ua: navigator.userAgent,
          title: document.title,
          url: window.location.href,
          ...params,
          startTime: validStartTime,
        }),
      });
    } else {
      data = await this.harbor.getAll();
      const startTime = data[0].timestamp;
      const endTime = data[data.length - 1].timestamp;
      data.push({
        type: 'meta',
        timestamp: endTime,
        data: minifyData({
          ua: navigator.userAgent,
          title: document.title,
          url: window.location.href,
          startTime,
          endTime,
          remark: params?.remark ?? '',
        }),
      });
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
    const args: any = await this.getParams(type as any, params);
    const isUpload = ['upload', 'upload-periods'].includes(type);
    const result = isUpload
      ? await startUpload(args)
      : await startDownload(args);

    if ((params as WholeActionParams).clearCache === true) {
      this.clearAndNotify();
    }

    if (result) {
      const url = this.getDebugUrl(result);
      this.$harborConfig.onAfterUpload?.(url, args.remark);
      return url;
    }
  }

  async upload(params?: WholeActionParams) {
    const result = await this.onOfflineLog('upload', params);
    return result;
  }

  async uploadPeriods(params: PeriodActionParams) {
    const result = await this.onOfflineLog('upload-periods', params);
    return result;
  }

  async download(params?: WholeActionParams) {
    await this.onOfflineLog('download', params);
  }

  async downloadPeriods(params: PeriodActionParams) {
    await this.onOfflineLog('download-periods', params);
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
