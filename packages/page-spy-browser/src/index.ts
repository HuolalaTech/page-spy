import copy from 'copy-to-clipboard';
import {
  Client,
  getAuthSecret,
  isArray,
  isClass,
  psLog,
  ROOM_SESSION_KEY,
  SocketState,
} from '@huolala-tech/page-spy-base';
import type {
  PageSpyPlugin,
  PageSpyPluginLifecycle,
  PageSpyPluginLifecycleArgs,
  PluginOrder,
} from '@huolala-tech/page-spy-types';
import { setup } from 'iseedeadpeople';
import type { InitConfig } from './config';

import ConsolePlugin from './plugins/console';
import ErrorPlugin from './plugins/error';
import NetworkPlugin from './plugins/network';
import SystemPlugin from './plugins/system';
import PagePlugin from './plugins/page';
import { StoragePlugin } from './plugins/storage';
import { DatabasePlugin } from './plugins/database';

import socketStore from './helpers/socket';
import Request from './api';

import type { UElement } from './helpers/moveable';
import { moveable } from './helpers/moveable';
import { Config, nodeId } from './config';
import { Toast } from './helpers/toast';
import modalLogoSvg from './assets/modal-logo.svg';
import copySvg from './assets/copy.svg';
import { modal } from './helpers/modal';
import classes from './assets/styles/index.module.less';
import { version } from '../package.json';
import { i18n } from './assets/locales';
import { eventBus } from './helpers/event-bus';

type UpdateConfig = {
  title?: string;
  project?: string;
};

class PageSpy {
  public static instance: PageSpy | null = null;

  public static plugins: Record<PluginOrder | 'normal', PageSpyPlugin[]> = {
    pre: [],
    normal: [],
    post: [],
  };

  public static get pluginsWithOrder() {
    return [
      ...PageSpy.plugins.pre,
      ...PageSpy.plugins.normal,
      ...PageSpy.plugins.post,
    ];
  }

  public static registerPlugin(plugin: PageSpyPlugin) {
    if (!plugin) {
      return;
    }
    if (isClass(plugin)) {
      psLog.error(
        'PageSpy.registerPlugin() expect to pass an instance, not a class',
      );
      return;
    }
    if (!plugin.name) {
      psLog.error(
        `The ${plugin.constructor.name} plugin should provide a "name" property`,
      );
      return;
    }
    const isExist = PageSpy.pluginsWithOrder.some(
      (i) => i.name === plugin.name,
    );
    if (isExist) {
      psLog.info(
        `The ${plugin.name} has registered. Consider the following reasons:
      - Duplicate register one same plugin;
      - Plugin's "name" conflict with others, you can print all registered plugins by "PageSpy.plugins";`,
      );
      return;
    }
    const currentPluginSet = PageSpy.plugins[plugin.enforce || 'normal'];
    currentPluginSet.push(plugin);
  }

  public static client = new Client({
    ua: navigator.userAgent,
    sdk: 'browser',
    sdkVersion: version,
  });

  public root: HTMLElement | null = null;

  public version = version;

  public request: Request | null = null;

  // Room address
  public address = '';

  public socketStore = socketStore;

  public config = new Config();

  public cacheTimer: ReturnType<typeof setInterval> | null = null;

  public eventBus = eventBus;

  constructor(ic: InitConfig = {}) {
    if (PageSpy.instance) {
      psLog.warn('Cannot initialize PageSpy multiple times');
      // eslint-disable-next-line no-constructor-return
      return PageSpy.instance;
    }
    const config = this.config.mergeConfig(ic);

    if (config.gesture) {
      setup(config.gesture, () => {
        if (PageSpy.instance) return;
        this.init();
      });
    } else {
      this.init();
    }
  }

  private async init() {
    PageSpy.instance = this;

    const config = this.config.get();
    if (config.lang) {
      i18n.setLang(config.lang);
    }
    this.updateConfiguration();
    this.triggerPlugins('onInit', { config, socketStore });

    // Online real-time mode
    if (config.offline === false) {
      this.request = new Request(config);

      if (this.cacheIsInvalid()) {
        await this.createNewConnection();
      } else {
        this.useOldConnection();
      }
      // reconnect when page switch to front-ground.
      document.addEventListener('visibilitychange', () => {
        // For browser, if the connection exist, no need to recreate.
        if (
          !document.hidden &&
          socketStore.getSocket().getState() !== SocketState.OPEN &&
          socketStore.connectable
        ) {
          this.useOldConnection();
        }
      });
    }
    psLog.log('Plugins inited');
    this.eventBus.dispatchEvent(new Event('core:inited'));
    if (config.autoRender) {
      this.render();
    }
  }

  private updateConfiguration() {
    const { messageCapacity, offline, useSecret } = this.config.get();
    if (useSecret === true) {
      const cache = JSON.parse(
        sessionStorage.getItem(ROOM_SESSION_KEY) as string,
      );
      this.config.set('secret', cache?.secret || getAuthSecret());
    }
    socketStore.connectable = true;
    socketStore.getPageSpyConfig = () => this.config.get();
    socketStore.getClient = () => PageSpy.client;
    socketStore.isOffline = offline;
    socketStore.messageCapacity = messageCapacity;
  }

  private cacheIsInvalid() {
    try {
      const roomCache = sessionStorage.getItem(ROOM_SESSION_KEY);
      if (!roomCache) return true;

      const cache = JSON.parse(roomCache);
      if (!cache.address) return true;

      const config = this.config.get();

      return ['project', 'title', 'useSecret'].some(
        (key) => cache[key] !== config[key as keyof InitConfig],
      );
    } catch (e) {
      return true;
    }
  }

  private async createNewConnection() {
    if (!this.request) {
      psLog.error('Cannot get the Request');
      return;
    }

    const roomInfo = await this.request.createRoom();
    this.address = roomInfo.address;
    socketStore.init(roomInfo.roomUrl);

    sessionStorage.removeItem(ROOM_SESSION_KEY);
    this.refreshRoomInfo();
  }

  private useOldConnection() {
    const cache = sessionStorage.getItem(ROOM_SESSION_KEY);
    if (!cache) {
      throw new Error('The cache info is invalid when useOldConnection');
    }

    const { address } = JSON.parse(cache);
    this.address = address;
    this.refreshRoomInfo();

    const url = this.request?.getRoomUrl(this.address);
    if (!url) return;
    socketStore.init(url);
  }

  private refreshRoomInfo() {
    this.saveSession();
    this.cacheTimer = setInterval(() => {
      if (socketStore.getSocket().getState() === SocketState.OPEN) {
        this.saveSession();
      }
    }, 15 * 1000);
  }

  private saveSession() {
    const { project, title, useSecret, secret } = this.config.get();
    const roomInfo = JSON.stringify({
      address: this.address,
      project,
      title,
      useSecret,
      secret,
    });
    sessionStorage.setItem(ROOM_SESSION_KEY, roomInfo);
  }

  private triggerPlugins<T extends PageSpyPluginLifecycle>(
    lifecycle: T,
    ...args: PageSpyPluginLifecycleArgs<T>
  ) {
    const { disabledPlugins } = this.config.get();
    PageSpy.pluginsWithOrder.forEach((plugin) => {
      if (
        isArray(disabledPlugins) &&
        disabledPlugins.length &&
        disabledPlugins.includes(plugin.name)
      ) {
        return;
      }
      // eslint-disable-next-line prefer-spread
      (plugin[lifecycle] as any)?.apply(plugin, [
        { ...args[0], modal, toast: Toast },
        args.slice(1),
      ]);
    });
  }

  // In FeiShu browser (Android, Chrome/75), due to the premature execution of synchronous render,
  // when execute `document.documentElement.append(root)` in the `render` function,
  // the browser will directly create a `body` element, and the final result is that
  // there will be multiple `body` elements on the page,
  // which leads to strange phenomena such as css style mismatches
  private render() {
    const root = document.querySelector(`#${nodeId}`);
    /* c8 ignore start */
    if (root) {
      psLog.warn('Cannot render the widget because it has been in the DOM');
      return;
    }
    if (document !== undefined) {
      if (document.readyState === 'loading') {
        window.addEventListener('DOMContentLoaded', this.render.bind(this));
      } else {
        this.startRender();
      }
    } else {
      // if document does not exist, wait for it
      let timer: ReturnType<typeof setTimeout>;
      const pollingDocument = () => {
        if (!!document && document.readyState === 'complete') {
          if (timer) {
            clearTimeout(timer);
          }
          this.startRender();
        } else {
          timer = setTimeout(pollingDocument, 1);
        }
      };
      timer = setTimeout(pollingDocument, 1);
    }
    /* c8 ignore stop */
  }

  private startRender() {
    const config = this.config.get();
    const {
      project,
      clientOrigin,
      title,
      logo: logoUrl,
      useSecret,
      secret,
      primaryColor,
      modal: modalConfig,
      offline,
    } = config;

    const doc = new DOMParser().parseFromString(
      `
      <!-- PageSpy Root Container -->
      <div id="${nodeId}" style="--primary-color: hsl(270, 100%, 55%)">
        <div class="page-spy-logo">
          <img src="${logoUrl}" alt="Logo" />
        </div>
      </div>

      <!-- Default content for modal -->
      <div class="${classes.connectInfo} page-spy-connect-info">
        <p>
          <span>Device ID</span>
          <b style="font-family: 'Monaco'" class="page-spy-device-id">
            ${this.address.slice(0, 4) || '--'}
          </b>
        </p>
        ${
          useSecret && secret
            ? `
        <p>
          <span>Secret</span>
          <b class="page-spy-secret">${secret}</b>
        </p>`
            : ''
        }
        <p>
          <span>Project</span>
          <b class="page-spy-project">${project}</b>
        </p>
        <p>
          <span>Title</span>
          <b class="page-spy-title">${title}</b>
        </p>
      </div>

      <!-- Default button for modal -->
      <button class="page-spy-btn" data-primary id="page-spy-copy-link">
        <img src="${copySvg}" alt="Copy" />
        <span>${i18n.t('copyLink')}</span>
      </button>
    `,
      'text/html',
    );

    const $ = (selector: string) => {
      return doc.querySelector.call(doc, selector);
    };
    const $c = (c: string) => $(`.${c}`);

    const root = $(`#${nodeId}`) as HTMLDivElement;
    root.style.setProperty('--primary-color', primaryColor);

    // pageSpyStyles 是 rollup.config.mjs 中 inject 的样式
    window.pageSpyStyles?.forEach((style) => {
      root.appendChild(style.cloneNode(true));
    });
    this.root = root;

    const logo = $('.page-spy-logo') as UElement;
    moveable(logo);

    const showModal = () => {
      if (logo.isMoveEvent) {
        return;
      }
      modal.show();
    };
    logo.addEventListener('click', showModal, false);
    window.addEventListener('sdk-inactive', () => {
      logo.classList.add('inactive');
    });

    const connectInfo = $c(classes.connectInfo) as HTMLDivElement;
    const copyLink = $('#page-spy-copy-link') as HTMLButtonElement;
    copyLink.addEventListener('click', () => {
      let text = `${clientOrigin}/#/devtools?address=${encodeURIComponent(
        this.address,
      )}`;
      if (useSecret) {
        text += `&secret=${secret}`;
      }
      const copied = copy(text);
      const message = copied ? i18n.t('copied') : i18n.t('copyFailed');
      modal.close();
      Toast.message(message);
    });
    if (offline) {
      copyLink.disabled = true;
      copyLink.title = 'In Offline Mode';
    }
    // 配置 modal 默认显示内容
    modal.build({
      logo: modalConfig.logo || modalLogoSvg,
      title: modalConfig.title || 'PageSpy',
      content: connectInfo,
      footer: [copyLink],
      mounted: root,
    });

    document.documentElement.insertAdjacentElement('beforeend', root);
    this.triggerPlugins('onMounted', {
      config,
      root,
      socketStore,
    });
    this.handleDeviceDPR();
    psLog.log('Render success');
    this.eventBus.dispatchEvent(new Event('core:rendered'));
  }

  private handleDeviceDPR() {
    const dpr = window.devicePixelRatio || 1;
    const viewportEl = document.querySelector('[name="viewport"]');

    if (viewportEl) {
      const viewportContent = viewportEl.getAttribute('content') || '';
      const initialScale = viewportContent.match(/initial-scale=\d+(\.\d+)?/);
      const scale = initialScale
        ? parseFloat(initialScale[0].split('=')[1])
        : 1;
      if (scale < 1) {
        this.root!.style.fontSize = `${14 * dpr}px`;
      }
    }
  }

  public updateRoomInfo(obj: UpdateConfig) {
    if (!obj) return;

    const { project, title } = obj;
    if (project) {
      this.config.set('project', String(project));
      const node = document.querySelector('.page-spy-project');
      if (node) {
        node.textContent = String(project);
      }
    }
    if (title) {
      this.config.set('title', String(title));
      const node = document.querySelector('.page-spy-title');
      if (node) {
        node.textContent = String(title);
      }
    }

    socketStore.updateRoomInfo();
  }

  public abort() {
    this.triggerPlugins('onReset');
    PageSpy.instance = null;

    socketStore.close();
    modal.reset();

    const root = document.querySelector(`#${nodeId}`);
    if (root) {
      document.documentElement.removeChild(root);
    }
    this.eventBus.dispatchEvent(new Event('core:aborted'));
  }
}

const INTERNAL_PLUGINS = [
  new ConsolePlugin(),
  new ErrorPlugin(),
  new NetworkPlugin(),
  new StoragePlugin(),
  new DatabasePlugin(),
  new PagePlugin(),
  new SystemPlugin(),
];

INTERNAL_PLUGINS.forEach((p) => {
  PageSpy.registerPlugin(p);
});

export default PageSpy;
