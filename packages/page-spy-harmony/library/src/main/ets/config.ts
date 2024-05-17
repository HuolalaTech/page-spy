import { ConfigBase } from './utils/config';
import type { InitConfig } from './types/harmony';

export class Config extends ConfigBase<InitConfig> {
  protected privateKeys: (keyof InitConfig)[] = ['secret'];

  protected defaultConfig = () => {
    return {
      api: '',
      project: 'default',
      title: '--',
      enableSSL: true,
      disabledPlugins: [],
      axios: null,
      messageCapacity: 1000,
      useSecret: false,
      secret: '',
    };
  };
}
