import { InitConfigBase } from './index';
import { AxiosInstance, AxiosStatic } from '@ohos/axios';

type InternalPlugins =
  | 'ConsolePlugin'
  | 'ErrorPlugin'
  | 'NetworkPlugin'
  | 'StoragePlugin'
  | 'DatabasePlugin'
  | 'PagePlugin'
  | 'SystemPlugin';

export interface InitConfig extends InitConfigBase {
  /**
   * Client host. Form example, "https://example.com".
   */
  clientOrigin?: string;
  /**
   * Indicate whether auto render the widget on the bottom-left corner.
   * You can manually render later by calling "window.$pageSpy.render()"
   * if passed false.
   * @default true
   */
  autoRender?: boolean;
  /**
   * All internal plugins are carried with PageSpy by default out of the box.
   * You can disable some plugins as needed.
   */
  disabledPlugins?: (InternalPlugins | string)[];
  /**
   * Indicate whether enable offline mode. Once enabled, PageSpy will not
   * make network requests and send data by server. Collected data can be
   * exported with "DataHarborPlugin" and then replayed in the debugger.
   */
  offline?: boolean;
  /**
   * Customize logo source url.
   */
  logo?: string;
  /**
   * Customize logo style.
   */
  logoStyle?: Object;
  /**
   * Reference of @ohos/axios
   */
  axios?: AxiosStatic | AxiosInstance;
}

export interface StorageRoomInfo {
  usable: boolean;
  name?: string;
  address?: string;
  roomUrl?: string;
  project?: string;
}
