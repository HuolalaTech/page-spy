import type { InitConfig } from 'types';
import { Modal } from './component/modal';
import { Content } from './component/content';

import type PageSpyPlugin from './plugins';
import ConsolePlugin from './plugins/console';
import ErrorPlugin from './plugins/error';
import NetworkPlugin from './plugins/network';
import SystemPlugin from './plugins/system';
import PagePlugin from './plugins/page';
import { StoragePlugin } from './plugins/storage';

import socketStore from './utils/socket';
import Request from './api';
import { getRandomId, psLog } from './utils';
import pkg from '../package.json';

import type { UElement } from './utils/moveable';
import { moveable } from './utils/moveable';
import './index.less';
import logoUrl from './assets/logo.svg';
import { mergeConfig } from './utils/config';
import { ROOM_SESSION_KEY } from './utils/constants';

const Identifier = '__pageSpy';

export default class PageSpy {
  root: HTMLElement | null = null;

  version = pkg.version;

  plugins: Record<string, PageSpyPlugin> = {};

  config: Required<InitConfig> | null = null;

  request: Request | null = null;

  // System info: <os>-<browser>:<browserVersion>
  name = '';

  // Room address
  address = '';

  // Completed websocket room url
  roomUrl = '';

  socketStore = socketStore;

  static instance: PageSpy | null = null;

  constructor(init: InitConfig = {}) {
    if (PageSpy.instance) {
      psLog.warn('Cannot initialize PageSpy multiple times');
      // eslint-disable-next-line no-constructor-return
      return PageSpy.instance;
    }
    PageSpy.instance = this;

    this.config = mergeConfig(init);
    this.request = new Request(this.config.api);

    this.loadPlugins(
      new ConsolePlugin(),
      new ErrorPlugin(),
      new NetworkPlugin(),
      new SystemPlugin(),
      new PagePlugin(),
      new StoragePlugin(),
    );
    this.init();
    window.addEventListener('beforeunload', () => {
      socketStore.close();
    });
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
    if (!this.config) {
      psLog.error('Cannot get the config info');
      return;
    }
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
      if (!usable || this.config.project !== prev) {
        await this.createNewConnection();
      } else {
        this.name = name;
        this.address = address;
        this.roomUrl = roomUrl;
        this.useOldConnection();
      }
    }
    psLog.log('Plugins inited');
    if (this.config.autoRender) {
      this.render();
    }
  }

  async createNewConnection() {
    if (!this.request || !this.config) {
      psLog.error('Cannot get the Request / config info');
      return;
    }
    const { data } = await this.request.createRoom(this.config.project);
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
      let timer: number;
      const pollingDocument = () => {
        if (!!document && document.readyState === 'complete') {
          if (timer) {
            clearTimeout(timer);
          }
          this.startRender();
        } else {
          timer = window.setTimeout(pollingDocument, 1);
        }
      };
      timer = window.setTimeout(pollingDocument, 1);
    }
  }

  refreshRoomInfo() {
    /* c8 ignore start */
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
    /* c8 ignore stop */
  }

  saveSession() {
    if (!this.config) {
      psLog.error('Cannot get the config info');
      return;
    }
    const { name, address, roomUrl } = this;
    const roomInfo = JSON.stringify({
      name,
      address,
      roomUrl,
      usable: true,
      project: this.config.project,
    });
    sessionStorage.setItem(ROOM_SESSION_KEY, roomInfo);
  }

  startRender() {
    if (!this.config) {
      psLog.error('Cannot get the config info');
      return;
    }
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
    logo.append(img);
    root.insertAdjacentElement('afterbegin', logo);

    const modal = new Modal();
    const content = new Content({
      content: {
        name: this.name,
        address: this.address,
        clientOrigin: this.config.clientOrigin,
        project: this.config.project,
      },
      onOk: () => {
        modal.close();
      },
    });
    modal.append(content.el!);
    root.append(modal.el);

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
    document.documentElement.append(root);
    moveable(logo);
    this.handleDeviceDPR();

    psLog.log('Render success');
  }

  handleDeviceDPR() {
    /* c8 ignore start */
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
    /* c8 ignore stop */
  }
}
