import { ConfigBase } from '@huolala-tech/page-spy-base';
import { InitConfigBase } from '@huolala-tech/page-spy-types';
import logoUrl from './assets/logo.svg';
import modalLogoUrl from './assets/modal-logo.svg';

export const nodeId = '__pageSpy';

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
   * Customize logo source url in float-ball.
   */
  logo?: string;
  /**
   * Customize brand primary color.
   */
  primaryColor?: string;
  /**
   * Customize modal.
   */
  modal?: {
    /**
     * Customize logo source url in modal.
     */
    logo?: string;
    /**
     * Customize modal title.
     */
    title?: string;
  };
}

export class Config extends ConfigBase<InitConfig> {
  /**
   * NOTE: the 'scriptLink' must be mark static, for
   * "document.currentScript.src" only valid after <script> load done.
   */
  public static scriptLink = (document.currentScript as HTMLScriptElement)?.src;

  protected privateKeys: (keyof InitConfig)[] = ['secret'];

  protected defaultConfig = () => {
    const defaultConfig = {
      api: '',
      project: 'default',
      title: '--',
      enableSSL: null,
      disabledPlugins: [],
      offline: false,
      messageCapacity: 1000,
      useSecret: false,
      secret: '',
      serializeData: false,
      dataProcessor: {},
      clientOrigin: '',
      autoRender: true,
      logo: logoUrl,
      primaryColor: '#8434e9',
      modal: {
        logo: modalLogoUrl,
        title: 'PageSpy',
      },
    };

    if (!Config.scriptLink) {
      return defaultConfig;
    }

    try {
      const { host, origin, protocol } = new URL(Config.scriptLink);
      const result = {
        ...defaultConfig,
        api: host,
        clientOrigin: origin,
        enableSSL: protocol.startsWith('https'),
      };
      return result;
    } catch (e) {
      return defaultConfig;
    }
  };
}
