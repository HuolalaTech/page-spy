import {
  InitConfigBase,
  PageSpyBase,
  PageSpyPlugin,
  PageSpyPluginLifecycle,
  PageSpyPluginLifecycleArgs,
} from '@huolala-tech/page-spy-types';

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
   * Indicate whether authorization is required. If enabled, PageSpy generates
   * a 6-digit random number (below "secret") as a password for the debug room,
   * which is required for developers to access the debug room
   * @default false
   */
  useSecret?: boolean;
  /**
   * @private
   */
  secret?: string;
}

interface PageSpyBrowser extends PageSpyBase {
  root: HTMLElement | null;
  config: Required<InitConfig> | null;
  render(): void;
  triggerPlugins<T extends PageSpyPluginLifecycle>(
    lifecycle: T,
    ...args: PageSpyPluginLifecycleArgs<T>
  ): void;
}

interface PageSpyConstructor {
  new (config?: InitConfig): PageSpyBrowser;
  instance: PageSpyBrowser | null;
  registerPlugin(plugin: PageSpyPlugin): void;
}

declare const PageSpy: PageSpyConstructor;

export default PageSpy;
