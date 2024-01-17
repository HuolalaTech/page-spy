import { ConfigBase } from 'base/src/config';
import type { InitConfig } from 'page-spy-browser/types/index';

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
      title: '',
      enableSSL: null,
      disabledPlugins: [],
    };

    if (!Config.scriptLink) {
      return defaultConfig;
    }

    try {
      const { host, origin } = new URL(Config.scriptLink);
      const result = {
        ...defaultConfig,
        api: host,
        clientOrigin: origin,
      };
      return result;
    } catch (e) {
      return defaultConfig;
    }
  };
}
