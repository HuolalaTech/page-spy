import type { InitConfig } from 'miniprogram/types/index';

export class Config {
  private static value: Required<InitConfig>;

  private static defaultConfig: () => Required<InitConfig> = () => {
    const defaultConfig: Required<InitConfig> = {
      api: '',
      project: 'default',
      title: '',
      enableSSL: null,
      disabledOnProd: true,
    };

    return defaultConfig;
  };

  public static mergeConfig = (userCfg: InitConfig): Required<InitConfig> => {
    Config.value = {
      /* c8 ignore next */
      ...Config.defaultConfig(),
      ...userCfg,
    };
    return Config.value;
  };

  public static get() {
    return Config.value;
  }
}
