import { makeMessage, Client } from '@huolala-tech/page-spy-base';
import type {
  SpySystem,
  PageSpyPlugin,
  OnInitParams,
} from '@huolala-tech/page-spy-types';
import socketStore from '../helpers/socket';
import { InitConfig } from '../config';

export default class SystemPlugin implements PageSpyPlugin {
  public name = 'SystemPlugin';

  public static hasInitd = false;

  public $pageSpyConfig: InitConfig | null = null;

  public onInit({ config }: OnInitParams<InitConfig>) {
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
    return {
      system: {
        ua: Client.getName(),
      },
      features: {},
    };
  }
}
