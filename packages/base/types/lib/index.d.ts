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
   * - true (Default): sdk will use ['https://', 'wss://'];
   */
  enableSSL?: boolean | null;
}

interface PageSpyBase {
  version: string;
  plugins: Record<string, PageSpyPlugin>;
  config: Required<InitConfigBase> | null;
  name: string;
  address: string;
  roomUrl: string;
}

interface PageSpyConstructor {
  new (config: InitConfigBase): PageSpy;
  instance: PageSpy | null;
}
