import type {
  SpySystem,
  PageSpyPlugin,
  SpyMP,
  OnInitParams,
} from '@huolala-tech/page-spy-types';
import { Client, combineName, makeMessage } from '@huolala-tech/page-spy-base';
import socketStore from '../helpers/socket';

export default class SystemPlugin implements PageSpyPlugin {
  public name = 'SystemPlugin';

  public static hasInitd = false;

  public $pageSpyConfig: SpyMP.MPInitConfig | null = null;

  public onInit({ config }: OnInitParams<SpyMP.MPInitConfig>) {
    if (SystemPlugin.hasInitd) return;
    SystemPlugin.hasInitd = true;

    this.$pageSpyConfig = config;

    socketStore.addListener('refresh', ({ source }, reply) => {
      const { data } = source;
      if (data === 'system') {
        const info = SystemPlugin.getSystemInfo();
        const processedByUser = this.$pageSpyConfig?.dataProcessor?.system?.(
          info as SpySystem.DataItem,
        );
        if (processedByUser === false) return;

        const msg = makeMessage('system', info);
        socketStore.dispatchEvent('public-data', msg);
        reply(msg);
      }
    });
  }

  public onReset() {
    SystemPlugin.hasInitd = false;
  }

  public static getSystemInfo() {
    const deviceInfo = Client.info;
    return {
      system: {
        ua: combineName(deviceInfo),
      },
      features: {},
    };
  }
}
