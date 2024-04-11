import { ConfigBase } from './utils/config';
import type { InitConfig } from './types/harmony';

export class Config extends ConfigBase<InitConfig> {
  protected defaultConfig = () => {
    return {
      api: '',
      clientOrigin: '',
      project: 'default',
      title: '--',
      enableSSL: null,
      disabledPlugins: [],
      autoRender: true,
      offline: false,
      logo: '',
      logoStyle: {},
      axios: null,
    };
  };
}
