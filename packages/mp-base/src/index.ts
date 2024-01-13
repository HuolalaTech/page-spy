import type { InitConfig } from 'mp-base/types/index';
import { getRandomId, psLog } from 'base/src';
import type { PageSpyPlugin } from '@huolala-tech/page-spy-types';
import { SocketState } from 'base/src/socket-base';
import { ROOM_SESSION_KEY } from 'base/src/constants';

import ConsolePlugin from './plugins/console';
import ErrorPlugin from './plugins/error';
import NetworkPlugin from './plugins/network';
import SystemPlugin from './plugins/system';
import StoragePlugin from './plugins/storage';

import socketStore from './helpers/socket';
import Request from './api';

// import './index.less';
// eslint-disable-next-line import/order
import { Config } from './config';
import Device from './device';
import { mp } from './utils';

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

  constructor(init: InitConfig) {
    if (PageSpy.instance) {
      psLog.warn('Cannot initialize PageSpy multiple times');
      // eslint-disable-next-line no-constructor-return
      return PageSpy.instance;
    }

    const { disabledOnProd } = this.config.mergeConfig(init);

    if (mp.canIUse('getAccountInfoSync')) {
      const accountInfo = mp.getAccountInfoSync().miniProgram;
      if (accountInfo.envVersion === 'release' && disabledOnProd !== false) {
        psLog.warn('PageSpy is not allowed on release env of mini program');
        // eslint-disable-next-line consistent-return
        return;
      }
    }

    Device.getInfo();

    PageSpy.instance = this;

    this.request = new Request(this.config);

    this.loadPlugins(
      new ConsolePlugin(),
      new ErrorPlugin(),
      new NetworkPlugin(),
      new SystemPlugin(),
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

    const config = this.config.get();
    const roomCache = mp.getStorageSync(ROOM_SESSION_KEY);
    if (!roomCache || typeof roomCache !== 'object') {
      await this.createNewConnection();
    } else {
      const { name, address, roomUrl, usable, project: prev, time } = roomCache;
      // The server will close the connection after 60s. for the sdk, we use 30s.
      if (!usable || config.project !== prev || time < Date.now() - 1000 * 30) {
        await this.createNewConnection();
      } else {
        this.name = name;
        this.address = address;
        this.roomUrl = roomUrl;
        this.useOldConnection();
      }
    }

    /* c8 ignore next 10 */
    if (mp.canIUse('onAppShow')) {
      mp.onAppShow(() => {
        // Mini programe can not detect ws disconnect (before we add heart beat ping pong).
        // So we need to refresh the connection.
        const state = socketStore.getSocket().getState();
        if (state === SocketState.CLOSED || state === SocketState.CLOSING) {
          this.useOldConnection();
        }
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
    // TODO when use old connection, must make sure it's connectable, then refresh the cache
    this.refreshRoomInfo();
    socketStore.init(this.roomUrl);
  }

  // avoid deleted by user code
  refreshRoomInfo() {
    /* c8 ignore start */
    this.saveSession();
    const timerId = setInterval(() => {
      const roomCache = mp.getStorageSync(ROOM_SESSION_KEY);
      if (roomCache && typeof roomCache === 'object') {
        const { usable } = roomCache;
        // unusable or time is expired, the room is not usable
        if (usable === false) {
          clearInterval(timerId);
          return;
        }
      }

      this.saveSession();
    }, 15 * 1000);
    /* c8 ignore stop */
    psLog.log(`Room ID: ${this.address.slice(0, 4)}`);
  }

  saveSession() {
    const ok = this.checkConfig();
    if (!ok) return;

    const { name, address, roomUrl } = this;
    const roomCache = {
      name,
      address,
      roomUrl,
      usable: true,
      project: this.config.get().project,
      time: Date.now(),
    };
    mp.setStorageSync(ROOM_SESSION_KEY, roomCache);
  }

  // eslint-disable-next-line class-methods-use-this
  checkConfig() {
    const config = this.config.get();
    /* c8 ignore next 3 */
    if (!config || !config.api) {
      psLog.error('Cannot get the config info');
      return false;
    }
    return true;
  }
}
