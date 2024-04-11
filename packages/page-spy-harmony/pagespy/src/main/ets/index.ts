import {
  PageSpyPlugin,
  PageSpyPluginLifecycle,
  PageSpyPluginLifecycleArgs,
  PluginOrder,
} from './types/lib';
import { getRandomId, isArray, isClass, psLog } from './utils';
import Request from './api';
import socketStore from './helpers/socket';
import { Config } from './config';
import { InitConfig, StorageRoomInfo } from './types';
import { ROOM_SESSION_KEY } from './utils/constants';
import ConsolePlugin from './plugins/console';
import ErrorPlugin from './plugins/error';
import NetworkPlugin from './plugins/network';
import SystemPlugin from './plugins/system';

class PageSpy {
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

  // TODO - 自动获取
  version = '0.0.1';

  request: Request | null = null;

  // System info: <os>-<browser>:<browserVersion>
  name = '';

  // Room address
  address = '';

  // Completed websocket room url
  roomUrl = '';

  socketStore = socketStore;

  config = new Config();

  constructor(init: InitConfig = {}) {
    if (PageSpy.instance) {
      psLog.warn('Cannot initialize PageSpy multiple times');
      return PageSpy.instance;
    }
    PageSpy.instance = this;

    const config = this.config.mergeConfig(init);

    this.triggerPlugins('onInit', { config, socketStore });
    this.init();
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

  async init() {
    const config = this.config.get();

    // Online real-time mode
    if (config.offline === false) {
      this.request = new Request(config);
      const roomCache = AppStorage.Get<StorageRoomInfo>(ROOM_SESSION_KEY);
      if (!roomCache) {
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
      // TODO
      // reconnect when page switch to front-ground.
      // document.addEventListener('visibilitychange', () => {
      //   // For browser, if the connection exist, no need to recreate.
      //   if (!document.hidden && !socketStore.connectionStatus) {
      //     this.useOldConnection();
      //   }
      // });
    }
    psLog.log(`Device ID: ${this.address.substring(0, 4)}`);
    if (config.autoRender) {
      this.render();
    }
  }

  abort() {
    this.triggerPlugins('onReset');
    socketStore.close();
    PageSpy.instance = null;
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

  render() {
    // TODO
  }

  refreshRoomInfo() {
    this.saveSession();
    const timerId = setInterval(() => {
      const latestRoomInfo = AppStorage.Get<StorageRoomInfo>(ROOM_SESSION_KEY);
      if (!!latestRoomInfo) {
        const { usable } = latestRoomInfo;
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
    const roomInfo = {
      name,
      address,
      roomUrl,
      usable: true,
      project: config.get().project,
    };
    AppStorage.SetOrCreate<StorageRoomInfo>(ROOM_SESSION_KEY, roomInfo);
  }
}

const INTERNAL_PLUGINS = [
  new ConsolePlugin(),
  new ErrorPlugin(),
  new NetworkPlugin(),
  // new StoragePlugin(),
  // new DatabasePlugin(),
  // new PagePlugin(),
  new SystemPlugin(),
];

INTERNAL_PLUGINS.forEach((p) => {
  PageSpy.registerPlugin(p);
});

export default PageSpy;
