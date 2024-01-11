import type { InitConfig } from 'page-spy-browser/types/index';
import copy from 'copy-to-clipboard';
import { getRandomId, psLog } from 'base/src';
import { ROOM_SESSION_KEY } from 'base/src/constants';
import type { PageSpyPlugin } from '@huolala-tech/page-spy-types';
import { Modal } from './component/modal';
import { Content } from './component/content';

import ConsolePlugin from './plugins/console';
import ErrorPlugin from './plugins/error';
import NetworkPlugin from './plugins/network';
import SystemPlugin from './plugins/system';
import PagePlugin from './plugins/page';
import { StoragePlugin } from './plugins/storage';

import socketStore from './helpers/socket';
import Request from './api';

import type { UElement } from './helpers/moveable';
import { moveable } from './helpers/moveable';
import './index.less';
import logoUrl from './assets/logo.svg';
// eslint-disable-next-line import/order
import { Config } from './config';
import { DatabasePlugin } from './plugins/database';
import { Toast } from './component/toast';

const Identifier = '__pageSpy';

export default class PageSpy {
  root: HTMLElement | null = null;

  version = PKG_VERSION;

  plugins: Record<string, PageSpyPlugin> = {};

  request: Request | null = null;

  // System info: <os>-<browser>:<browserVersion>
  name = '';

  // Room address
  address = '';

  // Completed websocket room url
  roomUrl = '';

  socketStore = socketStore;

  config = new Config();

  static instance: PageSpy | null = null;

  constructor(init: InitConfig = {}) {
    if (PageSpy.instance) {
      psLog.warn('Cannot initialize PageSpy multiple times');
      // eslint-disable-next-line no-constructor-return
      return PageSpy.instance;
    }
    PageSpy.instance = this;

    this.config.mergeConfig(init);
    this.request = new Request(this.config);

    this.loadPlugins(
      new ConsolePlugin(),
      new ErrorPlugin(),
      new NetworkPlugin(),
      new SystemPlugin(),
      new PagePlugin(),
      new StoragePlugin(),
      new DatabasePlugin(),
    );
    this.init();
  }

  loadPlugins(...args: PageSpyPlugin[]) {
    args.forEach((plugin) => {
      this.plugins[plugin.name] = plugin;
      if (plugin.onCreated) {
        plugin.onCreated();
      }
    });
  }

  async init() {
    const config = this.config.get();
    const roomCache = sessionStorage.getItem(ROOM_SESSION_KEY);
    if (roomCache === null) {
      await this.createNewConnection();
    } else {
      const {
        name,
        address,
        roomUrl,
        usable,
        project: prev,
      } = JSON.parse(roomCache);
      if (!usable || config.project !== prev) {
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
    const { data } = await this.request.createRoom();
    const roomUrl = this.request.getRoomUrl({
      address: data.address,
      name: `client:${getRandomId()}`,
      userId: 'Client',
    });
    this.name = data.name;
    this.address = data.address;
    this.roomUrl = roomUrl;
    this.refreshRoomInfo();
    socketStore.init(roomUrl);
  }

  useOldConnection() {
    this.refreshRoomInfo();
    socketStore.init(this.roomUrl);
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

  refreshRoomInfo() {
    this.saveSession();
    const timerId = setInterval(() => {
      const latestRoomInfo = sessionStorage.getItem(ROOM_SESSION_KEY);
      if (latestRoomInfo !== null) {
        const { usable } = JSON.parse(latestRoomInfo);
        if (usable === false) {
          clearInterval(timerId);
          return;
        }
      }

      this.saveSession();
    }, 15 * 1000);
  }

  saveSession() {
    const { name, address, roomUrl, config } = this;
    const roomInfo = JSON.stringify({
      name,
      address,
      roomUrl,
      usable: true,
      project: config.get().project,
    });
    sessionStorage.setItem(ROOM_SESSION_KEY, roomInfo);
  }

  startRender() {
    const { project, clientOrigin } = this.config.get();

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
    logo.insertAdjacentElement('beforeend', img);
    root.insertAdjacentElement('beforeend', logo);
    window.addEventListener('sdk-inactive', () => {
      logo.classList.add('inactive');
    });

    const modal = new Modal();
    const [os, browser] = this.name.split(' ');
    const content = new Content({
      content: `
      <p><b>Device ID:</b> <span style="font-family: 'Monaco'">${this.address.slice(
        0,
        4,
      )}</span></p>
      <p><b>System:</b> ${os}</p>
      <p><b>Browser:</b> ${browser}</p>
      <p><b>Project:</b> ${project}</p>
      `,
      onOk: () => {
        const text = `${clientOrigin}/#/devtools?version=${encodeURIComponent(
          this.name,
        )}&address=${encodeURIComponent(this.address)}`;
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
      const { isMoveEvent } = logo as unknown as UElement;
      /* c8 ignore next 3 */
      if (isMoveEvent) {
        return;
      }
      e.stopPropagation();
      modal.show();
    }
    logo.addEventListener('click', showModal, false);
    logo.addEventListener('touchend', showModal, false);
    document.documentElement.insertAdjacentElement('beforeend', root);
    moveable(logo);
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
}
