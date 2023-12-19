import type { InitConfig } from 'types';
import { isBrowser } from '.';

export class Config {
  private static value: Required<InitConfig>;

  public static scriptLink = isBrowser()
    ? (document.currentScript as HTMLScriptElement)?.src
    : '';

  private static resolveConfig: () => Required<InitConfig> = () => {
    const defaultConfig = {
      api: '',
      clientOrigin: '',
      project: 'default',
      autoRender: true,
      title: '',
      enableSSL: null,
    };
    if (!Config.scriptLink) {
      return defaultConfig;
    }

    const { host, origin } = new URL(Config.scriptLink);
    const result = {
      ...defaultConfig,
      api: host,
      clientOrigin: origin,
    };
    return result;
  };

  public static mergeConfig = (userCfg: InitConfig): Required<InitConfig> => {
    Config.value = {
      /* c8 ignore next */
      ...Config.resolveConfig(),
      ...userCfg,
    };
    return Config.value;
  };

  public static get() {
    return Config.value;
  }
}
