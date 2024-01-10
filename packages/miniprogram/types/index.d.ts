import { InitConfigBase, PageSpyBase } from 'base/types/lib';

export interface InitConfig extends InitConfigBase {
  /**
   * The server base url. For example, "example.com".
   * - Create room: `https://${api}/room/create`
   * - Filter room: `https://${api}/room/list`
   * - Join WebSocket room: `wss://${api}/ws/room/join`
   */
  api: string;

  /**
   * Disable pagespy on release environment.
   * - true (Default): only allow pagespy init on develop and trail environment.
   * - false
   */
  disabledOnProd?: boolean | null;
}

interface PageSpyMini extends PageSpyBase {
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
}

declare const PageSpy: PageSpyConstructor;

export default PageSpy;
