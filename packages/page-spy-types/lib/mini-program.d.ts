import { InitConfigBase } from './index';

type InternalPlugins =
  | 'ConsolePlugin'
  | 'ErrorPlugin'
  | 'NetworkPlugin'
  | 'StoragePlugin'
  | 'SystemPlugin';
export interface MPInitConfig extends InitConfigBase {
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

  /**
   * !! This option should not be used unless you read and understand below document: !!
   * For some mp types like mPaaS, DingTalk and some old version of Alipay, only one socket connection is allowed. But for some reason we cannot detect this feature by code, so we provide this option for you.
   * If you are developing mPaaS, DingTalk or some other ali-family mp which encounter a connection problem, you can set this option to true.
   */
  singletonSocket?: boolean;

  /**
   * All internal plugins are carried with PageSpy by default out of the box.
   * You can disable some plugins as needed.
   */
  disabledPlugins?: (InternalPlugins | string)[];
}
