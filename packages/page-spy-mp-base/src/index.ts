/**
 * This is the general implementation of PageSpy SDK for mini-program.
 * Mini-programs are similar, so they only need one base implementation, and
 * some minor customization each.
 *
 * For specific mp platform, it should only modify the code based on this repo,
 * NOT the @huolala-tech/page-spy-base, to avoid multi-packing. So this repo must
 * export all necessary items they need, like SocketStoreBase, Client.
 *
 * This pkg could be an external dependency.
 */

import {
  getAuthSecret,
  isArray,
  isClass,
  psLog,
} from '@huolala-tech/page-spy-base/dist/utils';
import { SocketState } from '@huolala-tech/page-spy-base/dist/socket-base';
import { atom } from '@huolala-tech/page-spy-base/dist/atom';
import { Client } from '@huolala-tech/page-spy-base/dist/client';
import { ROOM_SESSION_KEY } from '@huolala-tech/page-spy-base/dist/constants';
import { SocketStoreBase } from '@huolala-tech/page-spy-base/dist/socket-base';
import type {
  SpyMP,
  PageSpyPlugin,
  PageSpyPluginLifecycle,
  PluginOrder,
  PageSpyPluginLifecycleArgs,
} from '@huolala-tech/page-spy-types';

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
import { getMPSDK } from './helpers/mp-api';

type UpdateConfig = {
  title?: string;
  project?: string;
};

class PageSpy {
  root: HTMLElement | null = null;

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

  static client: Client;

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

    // in uniapp, caniuse may return true but...
    if (mp.canIUse('getAccountInfoSync') && mp.getAccountInfoSync) {
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

    // Here will check the config api
    this.request = new Request(this.config, PageSpy.client);
    this.updateConfiguration();
    PageSpy.client.plugins = PageSpy.pluginsWithOrder.map(
      (plugin) => plugin.name,
    );
    this.triggerPlugins('onInit', {
      socketStore,
      config,
      atom,
      client: PageSpy.client,
      mp,
    });

    this.init();
  }

  updateConfiguration() {
    const { messageCapacity, useSecret } = this.config.get();
    if (useSecret === true) {
      const mp = getMPSDK();
      const cache = mp.getStorageSync(ROOM_SESSION_KEY);
      const secret = cache?.secret || getAuthSecret();
      this.config.set('secret', secret);
      psLog.log(`Room Secret: ${secret}`);
    }

    socketStore.connectable = true;
    socketStore.getPageSpyConfig = () => this.config.get();
    socketStore.getClient = () => PageSpy.client;
    socketStore.messageCapacity = messageCapacity;
  }

  async init() {
    const mp = getMPSDK();
    const config = this.config.get();
    const roomCache = mp.getStorageSync(ROOM_SESSION_KEY);
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
    getMPSDK().setStorageSync(ROOM_SESSION_KEY, roomCache);
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

  getDebugLink() {
    const config = this.config.get();
    let link = `${config.enableSSL === false ? 'http://' : 'https://'}${config.api}/#/devtools?address=${encodeURIComponent(
      this.address,
    )}`;
    if (config.useSecret) {
      link += `&secret=${config.secret}`;
    }
    return link;
  }

  // open actions panal
  async showPanel() {
    const mp = getMPSDK();
    const that = this;
    const config = this.config.get();
    const options: {
      text: string;
      action: () => void;
    }[] = [
      {
        text: 'PageSpy 房间号：' + this.address.slice(0, 4),
        action() {
          mp.setClipboardData({
            data: that.getDebugLink(),
            success() {
              mp.showToast({
                title: '复制成功',
                icon: 'success',
              });
            },
          });
        },
      },
    ];
    if (config.useSecret) {
      options.push({
        text: `Secret：${config.secret}`,
        action() {
          mp.setClipboardData({
            data: config.secret,
            success() {
              mp.showToast({
                title: '复制成功',
                icon: 'success',
              });
            },
          });
        },
      });
    }
    PageSpy.pluginsWithOrder.forEach((plugin) => {
      if (plugin.onActionSheet) {
        const actions = plugin.onActionSheet();
        if (actions?.length) {
          options.push(...actions);
        }
      }
    });

    mp.showActionSheet({
      itemColor: '#b67cff',
      itemList: options.map((o) => o.text),
      success(res) {
        const option = options[res.tapIndex];
        if (option.action) {
          option.action();
        }
      },
    });
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
export { SocketStoreBase, Client, psLog };
export * from './types';
export * from './utils';
export * from './helpers/socket';
export * from './helpers/mp-api';
