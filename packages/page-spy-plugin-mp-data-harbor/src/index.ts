/* eslint-disable consistent-return */
import type {
  SpyMessage,
  OnInitParams,
  PageSpyPlugin,
  PluginOrder,
  InitConfigBase,
} from '@huolala-tech/page-spy-types';
import { removeEndSlash } from '@huolala-tech/page-spy-base/dist/utils';
import { MemoryHarbor } from './harbor/memoryHarbor';
import { startUpload } from './utils/upload';
import { buildSearchParams, getDeviceId, makeData, makeFile } from './utils';
import { DataType } from './harbor/base';
import {
  getMPSDK,
  type Client,
  type SocketStoreBase,
  psLog,
  MPPluginInitParams,
  setMPSDK,
} from '@huolala-tech/page-spy-mp-base';

interface DataHarborConfig {
  // Specify which types of data to collect.
  caredData?: Record<DataType, boolean>;

  // Custom uploaded filename by this.
  // Default value is `new Date().toLocaleString()`.
  filename?: () => string;
}

const defaultConfig: DataHarborConfig = {
  caredData: {
    console: true,
    network: true,
    storage: true,
    system: false,
    meta: true,
  },
  filename: () => {
    return new Date().toLocaleString();
  },
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
    this.$socketStore = socketStore;
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

    this.$socketStore.addListener('public-data', (message) => {
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
          const result = await this.upload();
        },
      },
    ];
  }

  async upload(clearCache = true) {
    const mp = getMPSDK();
    mp.showLoading({
      title: '正在上传离线日志...',
    });
    const { filename } = this.$harborConfig;
    const { project = '', title = '' } = this.$pageSpyConfig || {};
    const tags = {
      project,
      title,
      deviceId: getDeviceId(),
      // userAgent: navigator.userAgent,
      userAgent: this.client?.getName(),
    };

    const data = [...this.harbor.container];
    data.push(this.makeMetaInfo());

    const path = makeFile(data, filename());
    const url = `${this.apiBase}/api/v1/log/upload?${buildSearchParams(tags)}`;
    try {
      await startUpload({
        path,
        url,
      });

      if (clearCache) {
        this.harbor.clear();
        this.$socketStore?.dispatchEvent('harbor-clear', null);
      }
      mp.hideLoading();
      mp.showToast({
        title: '离线日志上传成功',
        icon: 'success',
      });
    } catch (e: any) {
      psLog.error(e);
      mp.hideLoading();
      mp.showToast({
        icon: 'error',
        title: '离线日志上传失败',
      });
    }
    // remove the local file
    const fs = mp.getFileSystemManager();
    fs.unlinkSync(path);
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
}
