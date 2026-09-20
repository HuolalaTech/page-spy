import type { DataItem as ConsoleData } from './console';
import type { DataItem as StorageData } from './storage';
import type { DataItem as PageData } from './page';
import type { DataItem as DatabaseData } from './database';
import type { DataItem as SystemData } from './system';
import type { RequestInfo } from './network';

/**
 * Base configuration for PageSpy initialization.
 *
 * This contract lives in page-spy-types so that plugin authors can consume
 * it without depending on the runtime implementation (page-spy-base).
 * `page-spy-base` validates the runtime value against this shape with zod
 * and re-exports this type.
 */
export interface InitConfigBase {
  /**
   * The server base url. For example, "example.com".
   * - Create room: `https://${api}/room/create`
   * - Filter room: `https://${api}/room/list`
   * - Join WebSocket room: `wss://${api}/ws/room/join`
   */
  api?: string;

  /**
   * Project name, used for group connections.
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
  enableSSL?: boolean;

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
  secret?: string;

  /**
   * Indicate whether enable offline mode. Once enabled, PageSpy will not
   * make network requests and send data by server. Collected data can be
   * exported with "DataHarborPlugin" and then replayed in the debugger.
   */
  offline?: boolean;

  /**
   * Indicate whether serialize non-primitive data in offline log.
   */
  serializeData?: boolean;

  /**
   * Internal plugins is out-of-box carried with PageSpy.
   * You can disable plugin by passing the plugin name to this option.
   */
  disabledPlugins?: string[];

  /**
   * Specify data processor for each data type.
   */
  dataProcessor?: {
    console?: (data: ConsoleData) => boolean | undefined;
    network?: (data: RequestInfo) => boolean | undefined;
    storage?: (data: StorageData) => boolean | undefined;
    database?: (data: DatabaseData) => boolean | undefined;
    page?: (data: PageData) => boolean | undefined;
    system?: (data: SystemData) => boolean | undefined;
  };
}
