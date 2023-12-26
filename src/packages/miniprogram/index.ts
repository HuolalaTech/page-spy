import type { InitConfig } from 'types';
import { getRandomId, psLog } from 'src/utils';
import type PageSpyPlugin from 'src/utils/plugin';

import ConsolePlugin from './plugins/console';
import ErrorPlugin from './plugins/error';
import NetworkPlugin from './plugins/network';
// import SystemPlugin from './plugins/system';
import { StoragePlugin } from './plugins/storage';

import socketStore from './helpers/socket';
import Request from './api';
import pkg from '../../../package.json';

// import './index.less';
// eslint-disable-next-line import/order
import { Config } from 'src/utils/config';

let roomCache: Record<string, any> | null = null;

export default class PageSpy {
  root: HTMLElement | null = null;

  version = pkg.version;

  plugins: Record<string, PageSpyPlugin> = {};

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

    const { api } = Config.mergeConfig(init);
    this.request = new Request(api);

    this.loadPlugins(
      new ConsolePlugin(),
      new ErrorPlugin(),
      new NetworkPlugin(),
      // new SystemPlugin(),
      new StoragePlugin(),
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
    const ok = this.checkConfig();
    if (!ok) return;

    const config = Config.get();
    if (roomCache === null) {
      await this.createNewConnection();
    } else {
      const { name, address, roomUrl, usable, project: prev } = roomCache;
      if (!usable || config.project !== prev) {
        await this.createNewConnection();
      } else {
        this.name = name;
        this.address = address;
        this.roomUrl = roomUrl;
        this.useOldConnection();
      }
    }

    if (wx.canIUse('onAppShow')) {
      wx.onAppShow(() => {
        // Mini programe can not detect ws disconnect (before we add heart beat ping pong). So we need to refresh the connection.
        this.useOldConnection();
      });
    }
    psLog.log('Plugins inited');
  }

  async createNewConnection() {
    const configOK = this.checkConfig();
    if (!configOK) return;

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

  refreshRoomInfo() {
    /* c8 ignore start */
    this.saveSession();
    const timerId = setInterval(() => {
      if (roomCache !== null) {
        const { usable } = roomCache;
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
    const ok = this.checkConfig();
    if (!ok) return;

    const { name, address, roomUrl } = this;
    roomCache = {
      name,
      address,
      roomUrl,
      usable: true,
      project: Config.get().project,
    };
  }

  // eslint-disable-next-line class-methods-use-this
  checkConfig() {
    const config = Config.get();
    if (!config) {
      psLog.error('Cannot get the config info');
      return false;
    }
    return true;
  }
}
