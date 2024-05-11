import { ConfigBase } from 'base/src/config';
import type { SpyMP } from '@huolala-tech/page-spy-types';

export class Config extends ConfigBase<SpyMP.MPInitConfig> {
  // I need to use generic type on this method, so it can't be static
  /* eslint-disable-next-line class-methods-use-this */
  protected defaultConfig() {
    return {
      api: '',
      project: 'default',
      title: '',
      enableSSL: null,
      disabledOnProd: true,
      disabledPlugins: [],
      singletonSocket: false,
    };
  }

  mergeConfig = (userCfg: SpyMP.MPInitConfig): Required<SpyMP.MPInitConfig> => {
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
