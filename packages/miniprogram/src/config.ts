import { ConfigBase } from 'base/src/config';
import type { InitConfig } from 'miniprogram/types/index';

export class Config extends ConfigBase<InitConfig> {
  // I need to use generic type on this method, so it can't be static
  /* eslint-disable-next-line class-methods-use-this */
  protected defaultConfig() {
    return {
      api: '',
      project: 'default',
      title: '',
      enableSSL: null,
      disabledOnProd: true,
    };
  }

  mergeConfig = (userCfg: InitConfig): Required<InitConfig> => {
    this.value = {
      /* c8 ignore next */
      ...this.defaultConfig(),
      ...userCfg,
    };
    return this.value;
  };

  get() {
    return this.value;
  }
}
