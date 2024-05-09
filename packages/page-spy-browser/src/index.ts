import type { InitConfig } from 'page-spy-browser/types/index';
import copy from 'copy-to-clipboard';
import { getAuthSecret, isArray, isClass, psLog } from 'base/src';
import { ROOM_SESSION_KEY } from 'base/src/constants';
import type {
  PageSpyPlugin,
  PageSpyPluginLifecycle,
  PageSpyPluginLifecycleArgs,
  PluginOrder,
} from '@huolala-tech/page-spy-types';
import { SocketState } from 'base/src/socket-base';
import { Modal } from './component/modal';
import { Content } from './component/content';

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
import './index.less';
// eslint-disable-next-line import/order
import { Config } from './config';
import { Toast } from './component/toast';

const Identifier = '__pageSpy';

class PageSpy {
  root: HTMLElement | null = null;

  version = PKG_VERSION;

  request: Request | null = null;

  // System info: <os>-<browser>:<browserVersion>
  name = '';

  // Room address
  address = '';

  // Completed websocket room url
  roomUrl = '';

  socketStore = socketStore;

  config = new Config();

  cacheTimer: ReturnType<typeof setInterval> | null = null;

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

  updateConfiguration() {
    const { messageCapacity, offline, useSecret } = this.config.get();
    if (useSecret === true) {
      const cache = JSON.parse(
        sessionStorage.getItem(ROOM_SESSION_KEY) as string,
      );
      this.config.set('secret', cache?.secret || getAuthSecret());
    }
    socketStore.getPageSpyConfig = () => this.config.get();
    socketStore.isOffline = offline;
    socketStore.messageCapacity = messageCapacity;
  }

  async init() {
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
        if (!document.hidden && !socketStore.connectionStatus) {
          this.useOldConnection();
        }
      });
    }
    psLog.log('Plugins inited');
    if (config.autoRender) {
      this.render();
    }
  }

  async createNewConnection() {
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

  useOldConnection() {
    this.refreshRoomInfo();
    socketStore.init(this.roomUrl);
  }

  refreshRoomInfo() {
    this.saveSession();
    this.cacheTimer = setInterval(() => {
      if (socketStore.getSocket().getState() === SocketState.OPEN) {
        this.saveSession();
      }
      this.saveSession();
    }, 15 * 1000);
  }

  saveSession() {
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

  startRender() {
    const {
      project,
      clientOrigin,
      title,
      logo: logoUrl,
      logoStyle,
      useSecret,
      secret,
    } = this.config.get();

    const root = document.createElement('div');
    root.id = Identifier;
    this.root = root;

    const logo = document.createElement('div');
    logo.className = 'page-spy-logo';
    const img = document.createElement('img');
    img.alt = 'PageSpy Logo';
    img.src = logoUrl;
    img.width = 50;
    img.height = 50;
    Object.entries(logoStyle).forEach(([key, value]) => {
      img.style[key as any] = value;
    });
    logo.insertAdjacentElement('beforeend', img);
    root.insertAdjacentElement('beforeend', logo);
    window.addEventListener('sdk-inactive', () => {
      logo.classList.add('inactive');
    });

    const modal = new Modal();
    const content = new Content({
      content: `
      ${useSecret ? `<p><b>Secret:</b> ${secret}</p>` : ''}
      <p>
        <b>Device ID:</b>
        <span style="font-family: 'Monaco'">
          ${this.address.slice(0, 4) || '--'}
        </span>
      </p>
      <p><b>Project:</b> ${project}</p>
      <p><b>Title:</b> ${title}</p>
      `,
      onOk: () => {
        const text = `${clientOrigin}/#/devtools?address=${encodeURIComponent(
          this.address,
        )}`;
        const copyRes = copy(text);
        let message = '';
        const langs = navigator.languages;
        const isCN = ['zh-CN', 'zh-HK', 'zh-TW', 'zh'].some((l) => {
          return langs.includes(l);
        });
        if (isCN) {
          message = copyRes ? '拷贝成功!' : '拷贝失败!';
        } else {
          message = copyRes ? 'Copy successfully!' : 'Copy failed!';
        }
        Toast.message(message);
        modal.close();
      },
    });
    modal.appendNode(content.el!);
    root.insertAdjacentElement('beforeend', modal.el);

    function showModal(e: any) {
      const { isMoveEvent, isHidden } = logo as unknown as UElement;
      /* c8 ignore next 3 */
      if (isMoveEvent || isHidden) {
        return;
      }
      e.stopPropagation();
      modal.show();
    }
    logo.addEventListener('click', showModal, false);
    logo.addEventListener('touchend', showModal, false);
    document.documentElement.insertAdjacentElement('beforeend', root);
    moveable(logo as unknown as UElement);
    this.triggerPlugins('onMounted', {
      root,
      content: content.el,
      socketStore,
    });
    this.handleDeviceDPR();

    psLog.log('Render success');
  }

  handleDeviceDPR() {
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

  triggerPlugins<T extends PageSpyPluginLifecycle>(
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

  abort() {
    this.triggerPlugins('onReset');
    socketStore.close();
    PageSpy.instance = null;
    const root = document.querySelector(`#${Identifier}`);
    if (root) {
      document.documentElement.removeChild(root);
    }
  }

  // In FeiShu browser (Android, Chrome/75), due to the premature execution of synchronous render,
  // when execute `document.documentElement.append(root)` in the `render` function,
  // the browser will directly create a `body` element, and the final result is that
  // there will be multiple `body` elements on the page,
  // which leads to strange phenomena such as css style mismatches
  render() {
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

  static instance: PageSpy | null = null;

  static plugins: Record<PluginOrder | 'normal', PageSpyPlugin[]> = {
    pre: [],
    normal: [],
    post: [],
  };

  static get pluginsWithOrder() {
    return [
      ...PageSpy.plugins.pre,
      ...PageSpy.plugins.normal,
      ...PageSpy.plugins.post,
    ];
  }

  static registerPlugin(plugin: PageSpyPlugin) {
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
      psLog.error(
        `The ${plugin.name} has registered. Consider the following reasons:
      - Duplicate register one same plugin;
      - Plugin's "name" conflict with others, you can print all registered plugins by "PageSpy.plugins";`,
      );
      return;
    }
    const currentPluginSet = PageSpy.plugins[plugin.enforce || 'normal'];
    currentPluginSet.push(plugin);
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
