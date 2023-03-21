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
import { getRandomId } from './utils';
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

  config: Required<InitConfig> = {
    api: '',
    clientOrigin: '',
  };

  // System info: <os>-<browser>:<browserVersion>
  name = '';

  // Room address
  address = '';

  // Completed websocket room url
  roomUrl = '';

  request: Request;

  // Room group
  project = 'default';

  // Debug client url origin
  clientOrigin = '';

  socketStore = socketStore;

  constructor(init: InitConfig = {}) {
    this.config = mergeConfig(init);
    const { api, clientOrigin } = this.config;

    this.request = new Request(api);
    this.clientOrigin = clientOrigin;

    const root = document.getElementById(Identifier);
    if (root) {
      console.error('PageSpy has been inited.');
      return;
    }
    this.loadPlugins(
      new ConsolePlugin(),
      new ErrorPlugin(),
      new NetworkPlugin(),
      new SystemPlugin(),
      new PagePlugin(),
      new StoragePlugin(),
    );
    window.addEventListener('DOMContentLoaded', async () => {
      await this.initConnection();
      this.deferRender();
    });
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

  async initConnection() {
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
      if (!usable || this.project !== prev) {
        await this.createNewConnection();
      } else {
        this.name = name;
        this.address = address;
        this.roomUrl = roomUrl;
        this.useOldConnection();
      }
    }
  }

  async createNewConnection() {
    const { data } = await this.request.createRoom(this.project);
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
  deferRender() {
    if (document !== undefined) {
      if (document.readyState === 'loading') {
        window.addEventListener('DOMContentLoaded', this.render);
      } else {
        this.render();
      }
    } else {
      // if document does not exist, wait for it
      let timer: number;
      const pollingDocument = () => {
        if (!!document && document.readyState === 'complete') {
          if (timer) {
            clearTimeout(timer);
          }
          this.render();
        } else {
          timer = window.setTimeout(pollingDocument, 1);
        }
      };
      timer = window.setTimeout(pollingDocument, 1);
    }
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
    const { name, address, roomUrl, project } = this;
    const roomInfo = JSON.stringify({
      name,
      address,
      roomUrl,
      usable: true,
      project,
    });
    sessionStorage.setItem(ROOM_SESSION_KEY, roomInfo);
  }

  render() {
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
        clientOrigin: this.clientOrigin,
        project: this.project,
      },
      onOk: () => {
        modal.close();
      },
    });
    modal.append(content.el!);
    root.append(modal.el);

    function showModal(e: any) {
      const { isMoveEvent } = logo as unknown as UElement;
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

    console.log('[PageSpy] init success.');
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
