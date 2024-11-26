import { type Client } from '@huolala-tech/page-spy-base';
import { makeMessage } from '@huolala-tech/page-spy-base/dist/message';
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

  public client: Client | null = null;

  public onInit({ config, client }: OnInitParams<InitConfig>) {
    if (SystemPlugin.hasInitd) return;
    SystemPlugin.hasInitd = true;

    this.$pageSpyConfig = config;
    this.client = client;
    this.onceInitPublicData();

    socketStore.addListener('refresh', ({ source }, reply) => {
      const { data } = source;
      if (data === 'system') {
        const info = this.getSystemInfo();
        if (info === null) return;

        reply(info);
      }
    });
  }

  public onceInitPublicData() {
    const info = this.getSystemInfo();
    if (info === null) return;

    socketStore.dispatchEvent('public-data', info);
  }

  public onReset() {
    SystemPlugin.hasInitd = false;
  }

  public getSystemInfo() {
    const info = {
      system: {
        ua: this.client?.getName(),
      },
      features: {},
    } as SpySystem.DataItem;
    const processedByUser = this.$pageSpyConfig?.dataProcessor?.system?.(info);

    if (processedByUser === false) return null;
    return makeMessage('system', info);
  }
}
