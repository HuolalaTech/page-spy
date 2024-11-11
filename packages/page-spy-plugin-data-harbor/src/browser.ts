/* eslint-disable consistent-return */
import type {
  SpyMessage,
  OnInitParams,
  PageSpyPlugin,
  PluginOrder,
  InitConfigBase,
  OnMountedParams,
  Modal,
} from '@huolala-tech/page-spy-types';
import {
  psLog,
  removeEndSlash,
  RequestItem,
  SocketStoreBase,
} from '@huolala-tech/page-spy-base';
import { BlobHarbor, PERIOD_DIVIDE_IDENTIFIER } from './harbor/blob';
import { DownloadArgs, startDownload } from './utils/download';
import { UploadArgs, startUpload } from './utils/upload';
import {
  formatTime,
  getDeviceId,
  isValidPeriod,
  jsonToFile,
  makeData,
} from './utils';
import { Actions, CacheMessageItem, DataType } from './harbor/base';
import { cropSvg, downloadSvg, uploadSvg } from './assets/svg';
import classes from './assets/index.module.less';
import { t } from './assets/locale';

interface DataHarborConfig {
  // Specify the maximum bytes of single harbor's container.
  // Default 10 * 1024 * 1024, 10MB.
  // If a period is specified, it will use the period.
  maximum?: number;

  // Set the duration of each period in milliseconds.
  // Default is 5 * 60 * 1000, 5 minutes.
  period?: number;

  // Specify which types of data to collect.
  caredData?: Record<DataType, boolean>;

  // Custom uploaded filename by this.
  // Default value is `new Date().toLocaleString()`.
  filename?: () => string;

  // Custom download behavior.
  onDownload?: ((data: CacheMessageItem[]) => void) | null;
}

const defaultConfig: Required<DataHarborConfig> = {
  maximum: 10 * 1024 * 1024,
  period: 5 * 60 * 1000,
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
      period: this.$harborConfig.period,
    });
  }

  public async onInit({
    socketStore,
    config,
    modal,
  }: OnInitParams<InitConfigBase>) {
    modal?.show({ content: '芜湖～' });
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

      const data = makeData(message.type, message.data);
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

  public onMounted({ modal }: OnMountedParams<InitConfigBase>) {
    if (DataHarborPlugin.hasMounted) return;
    DataHarborPlugin.hasMounted = true;

    if (modal) {
      this.buildModal(modal);
      modal.show({ content: '芜湖～' });
    }
  }
  // public onMounted({ config }: OnMountedParams) {
  //   if (DataHarborPlugin.hasMounted) return;
  //   DataHarborPlugin.hasMounted = true;

  //   if (isBrowser()) {
  //     const downloadBtn = buttonBindWithDownload(async () => {
  //       await this.onOfflineLog('download', false);
  //     });
  //     const uploadBtn = buttonBindWithUpload(async () => {
  //       const debugUrl = await this.onOfflineLog('upload', false);
  //       psLog.info(`${UPLOAD_TIPS.success}: ${debugUrl}`);
  //       return debugUrl;
  //     });

  //     content.insertAdjacentElement('beforeend', downloadBtn);
  //     content.insertAdjacentElement('beforeend', uploadBtn);
  //   }
  // }

  private buildModal(modal: Modal) {
    const doc = new DOMParser().parseFromString(
      `
      <!-- Add button for default modal -->
      <button class="page-spy-btn" data-dashed id="open-log-action">
        ${cropSvg}
        <span>${t.title}</span>
      </button>

      <!-- Show modal content on button#open-log-action clicked -->
      <div class="${classes.content}">
        <div class="${classes.timeInfo}">
          <div class="${classes.recorder}"></div>
          <div class="${classes.duration}"></div>
        </div>
        <div class="${classes.periodInfo}">
          <div class="${classes.label}">${t.selectPeriod}</div>
          <div class="${classes.selectPeriod}">
            <div class="${classes.track}">
              <div class="${classes.range}"></div>
            </div>
            <input type="range" id="harbor-period-min" class="${classes.minVal}" value="0" min="0" max="100" />
            <input type="range" id="harbor-period-max" class="${classes.maxVal}" value="100" min="0" max="100" />
          </div>
        </div>
        <div class="${classes.remarkInfo}">
          <div class="${classes.label}">${t.remark}</div>
          <textarea rows="5" id="harbor-remark" placeholder="${t.remarkPlaceholder}"></textarea>
        </div>
      </div>

      <!-- Upload / Download log button -->
      <button class="page-spy-btn" data-primary id="upload-log">
        ${uploadSvg}
        <span>${t.upload}</span>
      </button>
      <button class="page-spy-btn" data-primary id="download-log">
        ${downloadSvg}
        <span>${t.download}</span>
      </button>
      `,
      'text/html',
    );

    const $ = (selector: string) => {
      return doc.querySelector.call(doc, selector);
    };
    const $c = (c: string) => $(`.${c}`);

    const openLogAction = $('#open-log-action') as HTMLButtonElement;
    const modalContent = $c(classes.content) as HTMLDivElement;
    const range = $c(classes.range) as HTMLDivElement;
    const minThumb = $c(classes.minVal) as HTMLInputElement;
    const maxThumb = $c(classes.maxVal) as HTMLInputElement;
    const uploadButton = $('#upload-log') as HTMLButtonElement;
    const downloadButton = $('#download-log') as HTMLButtonElement;

    function updateRangeInTrack() {
      const total = +maxThumb.max;
      const left = +minThumb.value / total;
      const right = 1 - +maxThumb.value / total;
      range.style.setProperty('--left', `${(left * 100).toFixed(3)}%`);
      range.style.setProperty('--right', `${(right * 100).toFixed(3)}%`);
      range.style.setProperty('--min-text', `"${left}"`);
      range.style.setProperty('--max-text', `"${right}"`);
    }

    minThumb.addEventListener('input', function () {
      const max = +maxThumb.value - 5;
      const current = +this.value;
      if (current >= max) {
        minThumb.value = String(max);
        return;
      }
      updateRangeInTrack();
    });
    maxThumb.addEventListener('input', function () {
      const min = +minThumb.value + 5;
      const current = +this.value;
      if (current <= min) {
        maxThumb.value = String(min);
        return;
      }
      updateRangeInTrack();
    });

    let timer: ReturnType<typeof setInterval> | null = null;
    openLogAction?.addEventListener('click', () => {
      if (timer) clearInterval(timer);

      const duration = modalContent?.querySelector(`.${classes.duration}`);
      if (duration) {
        duration.textContent = formatTime(Date.now() - this.startTimestamp);
        timer = setInterval(() => {
          duration.textContent = formatTime(Date.now() - this.startTimestamp);
        }, 1000);
      }
      modal.show({
        content: modalContent,
        footer: [uploadButton, downloadButton],
      });
    });

    modal.build({
      footer: [...modal.config.footer, openLogAction],
    });
  }

  getParams(type: 'download'): Promise<DownloadArgs>;
  getParams(type: 'upload'): Promise<UploadArgs>;
  async getParams(type: Actions) {
    const { onDownload, filename } = this.$harborConfig;
    const { project = '', title = '' } = this.$pageSpyConfig || {};
    const tags = {
      project,
      title,
      deviceId: getDeviceId(),
      userAgent: navigator.userAgent,
    };
    const data = await this.harbor.getAll();
    // TODO
    // 需要区分 data ，如果分段了需要有更多操作
    if (type === 'download') {
      return {
        data,
        filename,
        customDownload: onDownload,
      } as DownloadArgs;
    }

    if (type === 'upload') {
      const file = jsonToFile(data, filename());
      const form = new FormData();
      form.append('log', file);
      return {
        url: `${this.apiBase}/api/v1/log/upload?${new URLSearchParams(tags).toString()}`,
        body: form,
      } as UploadArgs;
    }
  }

  onOfflineLog(type: 'download', clearCache?: boolean): Promise<void>;
  onOfflineLog(type: 'upload', clearCache?: boolean): Promise<string>;
  async onOfflineLog(type: Actions, clearCache = true): Promise<void | string> {
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

      if (clearCache) {
        this.clearAndNotify();
      }

      if (result) {
        return this.getDebugUrl(result);
      }
    } catch (e: any) {
      psLog.error(e.message);
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
    const node = document.getElementById('data-harbor-plugin-download');
    if (node) {
      node.remove();
    }
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
