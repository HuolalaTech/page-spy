import { getAuthSecret, isArray, isClass, psLog } from 'base/src';
import type {
  SpyMP,
  PageSpyPlugin,
  PageSpyPluginLifecycle,
  PluginOrder,
  PageSpyPluginLifecycleArgs,
} from '@huolala-tech/page-spy-types';
import { SocketState } from 'base/src/socket-base';
import { ROOM_SESSION_KEY } from 'base/src/constants';

import ConsolePlugin from './plugins/console';
import ErrorPlugin from './plugins/error';
import NetworkPlugin from './plugins/network';
import SystemPlugin from './plugins/system';
import StoragePlugin from './plugins/storage';

import socketStore, { MPSocketWrapper } from './helpers/socket';
import Request from './api';

// import './index.less';
// eslint-disable-next-line import/order
import { Config } from './config';
import { getMPSDK, utilAPI } from './utils';

type UpdateConfig = {
  title?: string;
  project?: string;
};

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

  constructor(init: SpyMP.MPInitConfig) {
    if (PageSpy.instance) {
      psLog.warn('Cannot initialize PageSpy multiple times');
      // eslint-disable-next-line no-constructor-return
      return PageSpy.instance;
    }

    const config = this.config.mergeConfig(init);

    if (config.singletonSocket) {
      MPSocketWrapper.isSingleSocket = true;
    }

    const mp = getMPSDK();

    if (mp.canIUse('getAccountInfoSync')) {
      const accountInfo = mp.getAccountInfoSync().miniProgram;
      if (
        accountInfo.envVersion === 'release' &&
        config.disabledOnProd !== false
      ) {
        psLog.warn('PageSpy is not allowed on release env of mini program');
        // eslint-disable-next-line consistent-return
        return;
      }
    }

    PageSpy.instance = this;
    const mpWarningText =
      '!!!WARNING!!!: When submitting the mini program for review, be sure to delete the SDK in the code, otherwise the review will fail.';

    psLog.log(mpWarningText);
    psLog.info(mpWarningText);
    psLog.warn(mpWarningText);

    // Here will check the config api
    this.request = new Request(this.config);
    this.updateConfiguration();
    this.triggerPlugins('onInit', { socketStore, config });

    this.init();
  }

  updateConfiguration() {
    const { messageCapacity, useSecret } = this.config.get();
    if (useSecret === true) {
      const cache = utilAPI.getStorage(ROOM_SESSION_KEY);
      this.config.set('secret', cache?.secret || getAuthSecret());
    }

    socketStore.getPageSpyConfig = () => this.config.get();
    socketStore.messageCapacity = messageCapacity;
  }

  async init() {
    const mp = getMPSDK();
    const config = this.config.get();
    const roomCache = utilAPI.getStorage(ROOM_SESSION_KEY);
    if (!roomCache || typeof roomCache !== 'object') {
      await this.createNewConnection();
    } else {
      const { name, address, roomUrl, project: prev } = roomCache;
      if (config.project !== prev) {
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
    if (!this.request) {
      psLog.error('Cannot get the Request');
      return;
    }
    const room = await this.request.createRoom();
    this.name = room.name;
    this.address = room.address;
    this.roomUrl = room.roomUrl;
    this.refreshRoomInfo();
    socketStore.init(room.roomUrl);
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
    this.cacheTimer = setInterval(() => {
      if (socketStore.getSocket().getState() === SocketState.OPEN) {
        this.saveSession();
      }
    }, 15 * 1000);
    /* c8 ignore stop */
    psLog.log(`Room ID: ${this.address.slice(0, 4)}`);
  }

  saveSession() {
    const { name, address, roomUrl, config } = this;
    const { useSecret, secret, project } = config.get();
    const roomCache = {
      name,
      address,
      roomUrl,
      project,
      useSecret,
      secret,
    };
    utilAPI.setStorage(ROOM_SESSION_KEY, roomCache);
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
      (plugin[lifecycle] as any)?.apply(plugin, args);
    });
  }

  abort() {
    this.triggerPlugins('onReset');
    socketStore.close();
    PageSpy.instance = null;
  }

  updateRoomInfo(obj: UpdateConfig) {
    if (!obj) return;

    const { project, title } = obj;
    if (project) {
      this.config.set('project', String(project));
    }
    if (title) {
      this.config.set('title', String(title));
    }

    socketStore.updateRoomInfo();
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
  new SystemPlugin(),
];

INTERNAL_PLUGINS.forEach((p) => {
  PageSpy.registerPlugin(p);
});

export default PageSpy;
