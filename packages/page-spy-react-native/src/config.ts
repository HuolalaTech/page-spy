import { ConfigBase } from 'base/src/config';
import { InitConfig } from 'page-spy-react-native/types';

export class Config extends ConfigBase<InitConfig> {
  protected privateKeys: (keyof InitConfig)[] = ['secret'];
  // I need to use generic type on this method, so it can't be static
  /* eslint-disable-next-line class-methods-use-this */
  protected defaultConfig() {
    return {
      api: '',
      project: 'default',
      title: '',
      enableSSL: true,
      disabledPlugins: [],
      useSecret: false,
      secret: '',
      messageCapacity: 0,
    };
  }
}
