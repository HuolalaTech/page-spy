import { ConfigBase } from 'base/src/config';
import type { InitConfig } from 'web/types/index';

export class Config extends ConfigBase<InitConfig> {
  public scriptLink = (document.currentScript as HTMLScriptElement)?.src;

  protected defaultConfig = () => {
    const defaultConfig = {
      api: '',
      clientOrigin: '',
      project: 'default',
      autoRender: true,
      title: '',
      enableSSL: null,
    };
    if (!this.scriptLink) {
      return defaultConfig;
    }

    try {
      const { host, origin } = new URL(this.scriptLink);
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
