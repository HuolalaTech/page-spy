import { ConfigBase } from 'base/src/config';
import type { InitConfig } from 'page-spy-browser/types/index';
import logoUrl from './assets/logo.svg';

export class Config extends ConfigBase<InitConfig> {
  /**
   * NOTE: the 'scriptLink' must be mark static, for
   * "document.currentScript.src" only valid after <script> load done.
   */
  public static scriptLink = (document.currentScript as HTMLScriptElement)?.src;

  protected defaultConfig = () => {
    const defaultConfig = {
      api: '',
      clientOrigin: '',
      project: 'default',
      autoRender: true,
      title: '--',
      enableSSL: null,
      disabledPlugins: [],
      offline: false,
      logo: logoUrl,
      logoStyle: {},
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
