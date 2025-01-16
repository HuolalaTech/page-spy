/* eslint-disable consistent-return */
import type {
  SpyMessage,
  PageSpyPlugin,
  PluginOrder,
  InitConfigBase,
} from '@huolala-tech/page-spy-types';
import { removeEndSlash } from '@huolala-tech/page-spy-base/dist/utils';
import {
  type Client,
  type SocketStoreBase,
  psLog,
  type MPPluginInitParams,
} from '@huolala-tech/page-spy-mp-base';
import { MemoryHarbor } from './harbor/memoryHarbor';
import { saveData } from './utils/upload';
import {
  buildSearchParams,
  formatFilename,
  getDeviceId,
  getMPSDK,
  makeData,
  setMPSDK,
} from './utils';
import { DataType, WholeActionParams } from './harbor/base';

interface DataHarborConfig {
  // Specify which types of data to collect.
  caredData?: Record<DataType, boolean>;

  // Custom uploaded filename by this.
  // Default value is a date time string.
  filename?: () => string;

  // Custom behavior after upload
  onAfterUpload?: (replayUrl: string) => void;
}

const defaultConfig: DataHarborConfig = {
  caredData: {
    console: true,
    network: true,
    storage: true,
    system: true,
    meta: true,
  },
  filename: () => {
    return new Date().toLocaleString();
  },
  onAfterUpload: () => {},
};

export default class MPDataHarborPlugin implements PageSpyPlugin {
  public enforce: PluginOrder = 'pre';

  public name = 'DataHarborPlugin';

  // "Harbor" is an abstraction for scheduling data actions.
  public harbor: MemoryHarbor;

  public apiBase: string = '';

  public isPaused = false;

  public $socketStore: SocketStoreBase | null = null;

  public $pageSpyConfig: InitConfigBase | null = null;

  public $harborConfig: Required<DataHarborConfig>;

  public client: Client | null = null;

  public static hasInited = false;

  constructor(config?: DataHarborConfig) {
    this.$harborConfig = {
      ...defaultConfig,
      ...config,
    } as Required<DataHarborConfig>;

    this.harbor = new MemoryHarbor();
  }

  public async onInit({
    socketStore,
    config,
    client,
    mp,
  }: MPPluginInitParams<InitConfigBase>) {
    if (MPDataHarborPlugin.hasInited) return;
    MPDataHarborPlugin.hasInited = true;
    setMPSDK(mp);
    this.$pageSpyConfig = config;
    this.$socketStore = socketStore as any; // TODO: fix this type issue
    this.client = client;

    const { api, enableSSL, offline } = config;
    if (!offline && !api) {
      psLog.warn(
        "Cannot upload log to PageSpy for miss 'api' configuration. See: ",
        config,
      );
    } else {
      // because this plugin is mainly used in mp, so align with mp sdk, default to https
      const apiScheme = enableSSL === false ? 'http://' : 'https://';
      this.apiBase = removeEndSlash(`${apiScheme}${api}`);
    }

    this.$socketStore?.addListener('public-data', (message) => {
      if (this.isPaused || !this.isCaredPublicData(message)) return;

      const data = makeData(message.type, message.data);

      const ok = this.harbor.add(data);
      if (!ok) {
        psLog.warn(`[${this.name}] Fail to save data in harbor `, data);
      }
    });
  }

  public onActionSheet() {
    return [
      {
        text: '上传离线日志',
        action: async () => {
          const mp = getMPSDK();
          mp.showLoading({ title: '正在上传离线日志...' });
          try {
            const result = await this.upload();
            mp.hideLoading();
            if (result) {
              this.$harborConfig.onAfterUpload(result);

              mp.showModal({
                title: '上传成功',
                confirmText: '复制链接',
                showCancel: false,
                success(res) {
                  if (res.confirm) {
                    mp.setClipboardData({
                      data: result,
                    });
                  }
                },
              });
            } else {
              mp.showToast({
                title: '上传失败',
              });
            }
          } catch (e) {
            mp.hideLoading();
            mp.showToast({
              title: '上传失败',
            });
          }
        },
      },
    ];
  }

  async upload(params?: WholeActionParams) {
    const mp = getMPSDK();
    const { filename } = this.$harborConfig;
    const { project = '', title = '' } = this.$pageSpyConfig || {};
    const tags = {
      project,
      title,
      deviceId: getDeviceId(),
      // userAgent: navigator.userAgent,
      userAgent: this.client?.getName(),
      remark: params?.remark || '',
      name: formatFilename(filename()) + '.json',
    };
    const data = [...this.harbor.container];
    data.push(this.makeMetaInfo());

    const url = `${this.apiBase}/api/v1/jsonLog/upload?${buildSearchParams(tags)}`;
    let debugUrl = '';
    try {
      const res = await saveData({
        data,
        url,
      });
      debugUrl = this.getDebugUrl(res);

      if (params?.clearCache !== false) {
        this.harbor.clear();
        this.$socketStore?.dispatchEvent('harbor-clear', null);
      }
    } catch (e: any) {
      psLog.error(e);
    }
    return debugUrl;
  }

  onReset() {
    this.harbor.clear();
    MPDataHarborPlugin.hasInited = false;
  }

  public pause() {
    this.isPaused = true;
  }

  public resume() {
    this.isPaused = false;
  }

  // Drop data in harbor and re-record
  public reharbor() {
    this.harbor.clear();
    this.$socketStore?.dispatchEvent('harbor-clear', null);
    if (this.isPaused) {
      this.isPaused = false;
    }
  }

  public isCaredPublicData(message: SpyMessage.MessageItem) {
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

      case 'network':
        return !!caredData.network;
      // const { url } = message.data as RequestItem;
      // const isFetchHarborStockUrl = this.harbor.stock.includes(url);
      // if (caredData.network && !isFetchHarborStockUrl) return true;
      // return false;
      default:
        return false;
    }
  }

  // To make sure the replay panel can properly display, we must put a client info
  // message to the data.
  protected makeMetaInfo() {
    const clientInfo = this.client?.makeClientInfoMsg();
    return {
      type: 'meta',
      timestamp: Date.now(),
      data: clientInfo,
    };
  }

  getDebugUrl(result: H.UploadResult | null) {
    if (!result || !result.success) return '';

    const debugOrigin = `${this.apiBase}/#/replay`;
    const logUrl = `${this.apiBase}/api/v1/log/download?fileId=${result.data.fileId}`;
    return `${debugOrigin}?url=${logUrl}`;
  }
}
