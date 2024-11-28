import { SocketStoreBase } from '@huolala-tech/page-spy-base';
import { DataItem as ConsoleData } from './console';
import { DataItem as StorageData } from './storage';
import { DataItem as PageData } from './page';
import { DataItem as DatabaseData } from './database';
import { DataItem as SystemData } from './system';
import { RequestInfo } from './network';
import { Modal } from './modal';
import { Toast } from './toast';

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
   * - null: sdk will automatically analyse the scheme by the
   *        'src' property value
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
   * Indicate whether serialize non-primitive data in offline log.
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

  [key: string]: any;
}

export interface UpdateConfig {
  title?: string;
  project?: string;
}

export interface PageSpyBase {
  version: string;
  plugins: Record<string, PageSpyPlugin>;
  config: Required<InitConfigBase> | null;
  name: string;
  address: string;
  roomUrl: string;
  abort(): void;
  updateRoomInfo(obj: UpdateConfig): void;
}

interface CommonParams {
  // Some utils class.
  modal?: Modal;
  toast?: Toast;
}

export interface OnInitParams<T extends InitConfigBase> extends CommonParams {
  /**
   * Config info which has merged the user passed value.
   */
  config: Required<T>;

  /**
   * Wrap the origin websocket instance, plugin developers can
   * communicate with Web / API by it.
   */
  socketStore: SocketStoreBase;

  /**
   * The atom instance to store js object info.
   */
  atom?: any;

  /**
   * The client info object.
   */
  client?: Client;
}

export interface OnMountedParams<T extends InitConfigBase>
  extends CommonParams {
  /**
   * Config info which has merged the user passed value.
   */
  config: Required<T>;

  // The root node which has `id="__pageSpy"` in DOM tree.
  root: HTMLDivElement;

  // Wrap the origin socket instance, plugin developers can
  // communicate with Web / API by it.
  socketStore: SocketStoreBase;
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

  /**
   * @description Register action buttons in client popup panel, define the
   * button text and callback.
   */
  public abstract onActionSheet?: () => {
    text: string;
    action: () => void | Promise<void>;
  }[];
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
