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
import './assets/styles/index.less';
// eslint-disable-next-line import/order
import { Config } from './config';
import { Toast } from './helpers/toast';
import locales from './assets/locales';
import modalLogoSvg from './assets/modal-logo.svg';
import copySvg from './assets/copy.svg';

const Identifier = '__pageSpy';

type UpdateConfig = {
  title?: string;
  project?: string;
};

Client.info.sdk = 'browser';
Client.info.ua = navigator.userAgent;

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

  public root: HTMLElement | null = null;

  public version = PKG_VERSION;

  public request: Request | null = null;

  // System info: <os>-<browser>:<browserVersion>
  public name = '';

  // Room address
  public address = '';

  // Completed websocket room url
  public roomUrl = '';

  public socketStore = socketStore;

  public config = new Config();

  public cacheTimer: ReturnType<typeof setInterval> | null = null;

  constructor(init: InitConfig = {}) {
    if (PageSpy.instance) {
      psLog.warn('Cannot initialize PageSpy multiple times');
      // eslint-disable-next-line no-constructor-return
      return PageSpy.instance;
    }
    PageSpy.instance = this;

    const config = this.config.mergeConfig(init);

    this.updateConfiguration();
    this.triggerPlugins('onInit', { config, socketStore });
    this.init();
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
    socketStore.isOffline = offline;
    socketStore.messageCapacity = messageCapacity;
  }

  private async init() {
    const config = this.config.get();

    // Online real-time mode
    if (config.offline === false) {
      this.request = new Request(config);

      const roomCache = sessionStorage.getItem(ROOM_SESSION_KEY);
      if (roomCache === null) {
        await this.createNewConnection();
      } else {
        const { name, address, roomUrl, project: prev } = JSON.parse(roomCache);
        if (config.project !== prev) {
          await this.createNewConnection();
        } else {
          this.name = name;
          this.address = address;
          this.roomUrl = roomUrl;
          this.useOldConnection();
        }
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
    if (config.autoRender) {
      this.render();
    }
  }

  private async createNewConnection() {
    if (!this.request) {
      psLog.error('Cannot get the Request');
      return;
    }
    const roomInfo = await this.request.createRoom();
    this.name = roomInfo.name;
    this.address = roomInfo.address;
    this.roomUrl = roomInfo.roomUrl;
    this.refreshRoomInfo();
    socketStore.init(roomInfo.roomUrl);
  }

  private useOldConnection() {
    this.refreshRoomInfo();
    socketStore.init(this.roomUrl);
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
    const { name, address, roomUrl, config } = this;
    const { useSecret, secret, project } = config.get();
    const roomInfo = JSON.stringify({
      name,
      address,
      roomUrl,
      project,
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
      (plugin[lifecycle] as any)?.apply(plugin, args);
    });
  }

  // In FeiShu browser (Android, Chrome/75), due to the premature execution of synchronous render,
  // when execute `document.documentElement.append(root)` in the `render` function,
  // the browser will directly create a `body` element, and the final result is that
  // there will be multiple `body` elements on the page,
  // which leads to strange phenomena such as css style mismatches
  private render() {
    const root = document.querySelector(`#${Identifier}`);
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
    const {
      project,
      clientOrigin,
      title,
      logo: logoUrl,
      logoStyle,
      useSecret,
      secret,
    } = this.config.get();

    const userLogoStyle = Object.entries(logoStyle).reduce(
      (acc, [key, value]) => {
        acc += `${key}: ${value};`;
        return acc;
      },
      '',
    );

    const dom = new DOMParser().parseFromString(
      `
      <!-- PageSpy Root Container -->
      <div id="${Identifier}">
        <div class="page-spy-logo">
          <img src="${logoUrl}" style="${userLogoStyle}" alt="PageSpy Logo" />
        </div>
      </div>

      <!-- Default content for modal -->
      <div class="connect-info">
        <p>
          <span>Device ID</span>
          <b style="font-family: 'Monaco'" class="page-spy-device-id">
            ${this.address.slice(0, 4) || '--'}
          </b>
        </p>
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
        <span>${locales.copyLink}</span>
      </button>
    `,
      'text/html',
    );

    const root = dom.querySelector(`#${Identifier}`) as HTMLDivElement;
    this.root = root;
    const logo: UElement = dom.querySelector('.page-spy-logo')!;

    const showModal = (e: MouseEvent | TouchEvent) => {
      if (logo.isMoveEvent || logo.isHidden) {
        return;
      }
      e.stopPropagation();
      this.config.modal.show();
    };
    logo.addEventListener('click', showModal, false);
    logo.addEventListener('touchend', showModal, false);
    window.addEventListener('sdk-inactive', () => {
      logo.classList.add('inactive');
    });

    const content: HTMLDivElement = dom.querySelector('.connect-info')!;
    const copyLink: HTMLButtonElement = dom.querySelector(
      '#page-spy-copy-link',
    )!;
    copyLink.addEventListener('click', () => {
      let text = `${clientOrigin}/#/devtools?address=${encodeURIComponent(
        this.address,
      )}`;
      if (useSecret) {
        text += `&secret=${secret}`;
      }
      const copied = copy(text);
      const message = copied ? locales.copied : locales.copyFailed;
      this.config.modal.close();
      Toast.message(message);
    });
    // 配置 modal 默认显示内容
    this.config.modal.build({
      logo: modalLogoSvg,
      title: 'PageSpy',
      content,
      footer: [copyLink],
      mounted: root,
    });

    document.documentElement.insertAdjacentElement('beforeend', root);
    moveable(logo as unknown as UElement);
    this.triggerPlugins('onMounted', {
      config: this.config,
      root,
      socketStore,
    });
    this.handleDeviceDPR();
    psLog.log('Render success');
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
        this.config.modal.root.style.fontSize = `${14 * dpr}px`;
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
    socketStore.close();
    PageSpy.instance = null;
    const root = document.querySelector(`#${Identifier}`);
    if (root) {
      document.documentElement.removeChild(root);
    }
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
