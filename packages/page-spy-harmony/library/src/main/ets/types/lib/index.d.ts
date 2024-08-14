import { SocketStoreType } from './base';
import { DataItem as ConsoleData } from './console';
import { DataItem as StorageData } from './storage';
import { DataItem as PageData } from './page';
import { DataItem as DatabaseData } from './database';
import { DataItem as SystemData } from './system';
import { RequestInfo } from './network';

export interface InitConfigBase {
  /**
   * The server base url. For example, "example.com".
   * - Create room: `https://${api}/room/create`
   * - Filter room: `https://${api}/room/list`
   * - Join WebSocket room: `wss://${api}/ws/room/join`
   */
  api?: string;

  /**
   * Project name, used for group connections
   */
  project?: string;

  /**
   * Custom title for displaying some data like user info to
   * help you to distinguish the client. The title value will
   * show in the room-list route page.
   */
  title?: string;

  /**
   * Specify the server <scheme> manually.
   * - false: sdk will use ['http://', 'ws://'];
   * - true: sdk will use ['https://', 'wss://'];
   */
  enableSSL?: boolean | null;
  /**
   * Specify how many messages to cache.
   * The data is primarily used for define "socketStore.messageCapacity" to
   * configure the maximum number of historical data the SDK can send
   * after the debugging terminal goes online.
   */
  messageCapacity?: number;
  /**
   * Indicate whether authorization is required. If enabled, PageSpy generates
   * a 6-digit random number (below "secret") as a password for the debug room,
   * which is required for developers to access the debug room
   * @default false
   */
  useSecret?: boolean;

  /**
   * The 6-digit random number for authorization.
   * @private
   */
  secret?: string;

  /**
   * Indicate whether serialize data which emit by 'public-data' event.
   * @default false
   */
  serializeData?: boolean;

  /**
   *
   */
  dataProcessor?: {
    console?: (data: ConsoleData) => boolean;
    network?: (data: RequestInfo) => boolean;
    storage?: (data: StorageData) => boolean;
    database?: (data: DatabaseData) => boolean;
    page?: (data: PageData) => boolean;
    system?: (data: SystemData) => boolean;
  };
}

export interface PageSpyBase {
  version: string;
  plugins: Record<string, PageSpyPlugin>;
  config: Required<InitConfigBase> | null;
  name: string;
  address: string;
  roomUrl: string;
  abort(): void;
}

interface OnInitParams<T extends InitConfigBase = InitConfigBase> {
  /**
   * Config info which has merged the user passed value.
   */
  config: Required<T>;

  /**
   * Wrap the origin websocket instance, plugin developers can
   * communicate with Web / API by it.
   */
  socketStore: SocketStoreType;
}

export interface OnMountedParams {
  // Wrap the origin socket instance, plugin developers can
  // communicate with Web / API by it.
  socketStore: SocketStoreType;
}

export type PluginOrder = 'pre' | 'post';

export abstract class PageSpyPlugin {
  public abstract name: string;

  /**
   * @description Specify the plugin ordering.
   * The plugin invocation will be in the following order:
   *   1. Plugins with `enforce: "pre"`;
   *   2. Plugins without enforce value;
   *   3. Plugins with `enforce: "post"`;
   */
  public abstract enforce?: PluginOrder;

  /**
   * @description Called after "new PageSpy()".
   */
  public abstract onInit: (params: OnInitParams) => any;

  /**
   * @description Called after PageSpy render done (if there have).
   */
  public abstract onMounted?: (params: OnMountedParams) => any;

  /**
   * @description Called once user don't need to PageSpy,
   * plugins should reset to the origin function.
   */
  public abstract onReset?: () => any;
}

// prettier-ignore
export type PageSpyPluginLifecycle = keyof {
  [K in keyof PageSpyPlugin as K extends `on${string}`
    ? K
    : never
  ]: PageSpyPlugin[K];
};

export type PageSpyPluginLifecycleArgs<T extends PageSpyPluginLifecycle> =
  Parameters<NonNullable<PageSpyPlugin[T]>>;
