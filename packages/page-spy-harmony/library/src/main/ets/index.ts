import {
  PageSpyPlugin,
  PageSpyPluginLifecycle,
  PageSpyPluginLifecycleArgs,
  PluginOrder,
} from './types/lib';
import { getAuthSecret, isArray, isClass, psLog } from './utils';
import Request from './api';
import socketStore from './helpers/socket';
import { Config } from './config';
import { InitConfig, RoomInfo } from './types';
import ConsolePlugin from './plugins/console';
import ErrorPlugin from './plugins/error';
import NetworkPlugin from './plugins/network';
import SystemPlugin from './plugins/system';
import { SocketState, UpdateConfig } from './utils/socket-base';
import StoragePlugin from './plugins/storage';
import { Preferences } from './utils/preferences';
import Client from './utils/client';

class PageSpy {
  // TODO - 自动获取
  version = '2.0.0';

  request: Request | null = null;

  // System info: <os>-<browser>:<browserVersion>
  name = '';

  // Room address
  address = '';

  // Completed websocket room url
  roomUrl = '';

  socketStore = socketStore;

  config = new Config();

  preferences: Preferences | null = null;

  cacheTimer: ReturnType<typeof setInterval> | null = null;

  constructor(userCfg: InitConfig = { api: '', context: null }) {
    if (PageSpy.instance) {
      psLog.warn('Cannot initialize PageSpy multiple times');
      return PageSpy.instance;
    }
    PageSpy.instance = this;

    const config = this.config.mergeConfig(userCfg);

    this.request = new Request(config);
    this.preferences = new Preferences(userCfg.context);
    this.updateConfiguration();
    this.triggerPlugins('onInit', { config, socketStore });
    Client.plugins = PageSpy.pluginsWithOrder.map((plugin) => plugin.name);
    this.init();
  }

  updateConfiguration() {
    const { messageCapacity, useSecret } = this.config.get();
    if (useSecret === true) {
      this.config.set('secret', getAuthSecret());
    }
    socketStore.connectable = true;
    socketStore.getPageSpyConfig = () => this.config.get();
    socketStore.messageCapacity = messageCapacity;
  }

  async init() {
    const config = this.config.get();
    const roomCache = await this.preferences.get();

    if (!roomCache) {
      await this.createNewConnection();
    } else {
      const { name, address, roomUrl, project: prev } = roomCache;
      if (config.project !== prev || roomUrl.includes(config.api) === false) {
        await this.createNewConnection();
      } else {
        this.name = name;
        this.address = address;
        this.roomUrl = roomUrl;
        this.useOldConnection();
      }
    }
    psLog.log(`Device ID: ${this.address.substring(0, 4)}`);
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
    this.refreshRoomInfo();
    socketStore.init(this.roomUrl);
  }

  refreshRoomInfo() {
    this.saveSession();
    this.cacheTimer = setInterval(() => {
      if (socketStore.getSocket().getState() === SocketState.OPEN) {
        this.saveSession();
      }
    }, 15 * 1000);
  }

  async saveSession() {
    const { name, address, roomUrl, config } = this;
    const { useSecret, secret, project, title } = config.get();
    const roomInfo: RoomInfo = {
      name,
      address,
      roomUrl,
      project,
      title,
      useSecret,
      secret,
    };
    const flag = await this.preferences.set(roomInfo);
    return flag;
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

  updateRoomInfo(obj: Pick<UpdateConfig, 'project' | 'title'>) {
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

export { PageSpy };
