import socketStore from '../helpers/socket';
import { InitConfig, OnInitParams, PageSpyPlugin, SpySystem } from '../types';
import Client from '../utils/client';
import { makeMessage } from '../utils/message';

export default class SystemPlugin implements PageSpyPlugin {
  public name = 'SystemPlugin';

  public static hasInitd = false;

  public $pageSpyConfig: InitConfig | null = null;

  public onInit({ config }: OnInitParams<InitConfig>) {
    if (SystemPlugin.hasInitd) return;
    SystemPlugin.hasInitd = true;

    this.$pageSpyConfig = config;
    this.onceInitPublicData();

    socketStore.addListener('refresh', async ({ source }, reply) => {
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
        ua: Client.getName(),
      },
      features: {},
    } as SpySystem.DataItem;
    const processedByUser = this.$pageSpyConfig?.dataProcessor?.system?.(info);

    if (processedByUser === false) return null;
    return makeMessage('system', info);
  }
}
