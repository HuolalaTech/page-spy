import PageSpyPlugin from 'src/plugins';
export interface InitConfig {
  /**
   * The server base url. For example, "example.com".
   * - Create room: `https://${api}/room/create`
   * - Filter room: `https://${api}/room/list`
   * - Join WebSocket room: `wss://${api}/ws/room/join`
   */
  api?: string;

  /**
   * Client host. Form example, "https://example.com".
   */
  clientOrigin?: string;
  /**
   * Project name, used for group connections
   */
  project?: string;
  /**
   * Indicate whether auto render the widget on the bottom-left corner.
   * You can manually render later by calling "window.$pageSpy.render()"
   * if passed false.
   * @default true
   */
  autoRender?: boolean;
  /**
   * Custom title for displaying some data like user info to
   * help you to distinguish the client. The title value will
   * show in the room-list route page.
   */
  title?: string;
}

export * as SpyDevice from './lib/device';
export * as SpySocket from './lib/socket-event';
export * as SpyMessage from './lib/message-type';
export * as SpyAtom from './lib/atom';

export * as SpyConsole from './lib/console';
export * as SpySystem from './lib/system';
export * as SpyNetwork from './lib/network';
export * as SpyStorage from './lib/storage';
export * as SpyPage from './lib/page';
export * as SpyDatabase from './lib/database';

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

declare global {
  interface Window {
    PageSpy: PageSpyConstructor;
  }
}
