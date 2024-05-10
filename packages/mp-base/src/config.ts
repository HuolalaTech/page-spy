import { ConfigBase } from 'base/src/config';
import type { SpyMP } from '@huolala-tech/page-spy-types';

export class Config extends ConfigBase<SpyMP.MPInitConfig> {
  protected privateKeys: (keyof SpyMP.MPInitConfig)[] = ['secret'];

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
      messageCapacity: 1000,
      useSecret: false,
      secret: '',
    };
  }
}
