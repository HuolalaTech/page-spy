export interface InitConfig {
  /**
   * The server base url. For example, "example.com".
   * - Create room: `https://${api}/room/create`
   * - Filter room: `https://${api}/room/list`
   * - Join WebSocket room: `wss://${api}/ws/room/join`
   */
  api: string;
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
   * - true (Default): sdk will use ['https://', 'wss://'];
   */
  enableSSL?: boolean | null;
}

export * as SpyDevice from './lib/device';
export * as SpySocket from './lib/socket-event';
export * as SpyMessage from './lib/message-type';
export * as SpyAtom from './lib/atom';

export * as SpyConsole from './lib/console';
export * as SpySystem from './lib/system';
export * as SpyNetwork from './lib/network';
export * as SpyStorage from './lib/storage';

interface PageSpyPlugin {
  name: string;
  onCreated?(): void;
  onLoaded?(): void;
}

interface PageSpy {
  root: HTMLElement | null;
  version: string;
  plugins: Record<string, PageSpyPlugin>;
  config: Required<InitConfig> | null;
  name: string;
  address: string;
  roomUrl: string;
}

interface PageSpyConstructor {
  new (config: InitConfig): PageSpy;
  instance: PageSpy | null;
  render(): void;
}

declare const PageSpy: PageSpyConstructor;

export default PageSpy;
