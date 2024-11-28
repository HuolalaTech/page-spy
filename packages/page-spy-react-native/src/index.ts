import {
  getAuthSecret,
  isArray,
  isClass,
  psLog,
} from '@huolala-tech/page-spy-base/dist/utils';
import { Client } from '@huolala-tech/page-spy-base/dist/client';
import type {
  PageSpyPlugin,
  PageSpyPluginLifecycle,
  PluginOrder,
  PageSpyPluginLifecycleArgs,
  SpyClient,
} from '@huolala-tech/page-spy-types';

import { Platform } from 'react-native';
import ConsolePlugin from './plugins/console';
import ErrorPlugin from './plugins/error';
import NetworkPlugin from './plugins/network';
import SystemPlugin from './plugins/system';

import socketStore from './helpers/socket';
import Request from './api';

// eslint-disable-next-line import/order
import { Config, InitConfig } from './config';

const osMap: Record<typeof Platform.OS, SpyClient.OS> = {
  android: 'android',
  ios: 'ios',
  windows: 'windows',
  macos: 'mac',
  web: 'unknown', // this should not happen.
};

type UpdateConfig = {
  title?: string;
  project?: string;
};

const rnv = Platform.constants.reactNativeVersion;

class PageSpy {
  version = PKG_VERSION;

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

  static client: Client;

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

  constructor(init: InitConfig) {
    if (PageSpy.instance) {
      psLog.warn('Cannot initialize PageSpy multiple times');
      // eslint-disable-next-line no-constructor-return
      return PageSpy.instance;
    }

    const config = this.config.mergeConfig(init);

    // Here will check the config api
    this.request = new Request(this.config, PageSpy.client);
    this.updateConfiguration();
    PageSpy.instance = this;

    this.triggerPlugins('onInit', { socketStore, config });

    this.init();
  }

  updateConfiguration() {
    const { messageCapacity, useSecret } = this.config.get();
    if (useSecret === true) {
      const secret = getAuthSecret();
      this.config.set('secret', secret);
      psLog.log(`Room Secret: ${secret}`);
    }

    socketStore.connectable = true;
    socketStore.getPageSpyConfig = () => this.config.get();
    socketStore.getClient = () => PageSpy.client;
    socketStore.messageCapacity = messageCapacity;
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
    await this.createNewConnection();
    psLog.log('Plugins inited');
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
    const roomInfo = await this.request.createRoom();
    this.name = roomInfo.name;
    this.address = roomInfo.address;
    this.roomUrl = roomInfo.roomUrl;
    socketStore.init(roomInfo.roomUrl);
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
}

PageSpy.client = new Client({
  osType: osMap[Platform.OS] || 'unknown',
  osVersion: String(Platform.Version),
  browserType: 'react-native',
  browserVersion: `${rnv.major}.${rnv.minor}.${rnv.patch}${
    rnv.prerelease ? '-' + rnv.prerelease : ''
  }`,
  framework: 'react-native',
  sdk: 'rn',
});

const INTERNAL_PLUGINS = [
  new ConsolePlugin(),
  new ErrorPlugin(),
  new NetworkPlugin(),
  new SystemPlugin(),
];

INTERNAL_PLUGINS.forEach((p) => {
  PageSpy.registerPlugin(p);
});

export default PageSpy;
