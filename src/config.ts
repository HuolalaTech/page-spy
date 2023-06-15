import type { InitConfig } from 'types';

export class PageSpyConfig {
  private static configInfo: Required<InitConfig> = {
    api: '',
    clientOrigin: '',
    project: 'default',
    autoRender: true,
    webrtc: null,
  };

  private static resolveConfig = () => {
    const scriptLink = (document.currentScript as HTMLScriptElement)?.src;
    /* c8 ignore next 3 */
    if (!scriptLink) {
      return null;
    }
    const { host, origin } = new URL(scriptLink);
    return {
      api: host,
      clientOrigin: origin,
      project: 'default',
      autoRender: true,
      webrtc: null,
    };
  };

  public static get() {
    return PageSpyConfig.configInfo;
  }

  public static merge = (config: InitConfig): Required<InitConfig> => {
    PageSpyConfig.configInfo = {
      ...PageSpyConfig.configInfo,
      ...PageSpyConfig.resolveConfig(),
      ...config,
    };
    return PageSpyConfig.configInfo;
  };
}
