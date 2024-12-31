import type {
  SpySystem,
  PageSpyPlugin,
  SpyMP,
  OnInitParams,
} from '@huolala-tech/page-spy-types';
import { makeMessage } from '@huolala-tech/page-spy-base/dist/message';
import type { Client } from '@huolala-tech/page-spy-base/dist/client';
import socketStore from '../helpers/socket';
import { getMPSDK } from '../helpers/mp-api';
import { promisifyMPApi } from '../utils';

export default class SystemPlugin implements PageSpyPlugin {
  public name = 'SystemPlugin';

  public static hasInitd = false;

  public $pageSpyConfig: SpyMP.MPInitConfig | null = null;

  public client: Client | null = null;

  public onInit({ config, client }: OnInitParams<SpyMP.MPInitConfig>) {
    if (SystemPlugin.hasInitd) return;
    SystemPlugin.hasInitd = true;

    this.$pageSpyConfig = config;
    this.client = client;
    this.onceInitPublicData();

    socketStore.addListener('refresh', ({ source }, reply) => {
      const { data } = source;
      if (data === 'system') {
        this.getSystemInfo().then((info) => {
          if (info === null) return;
          reply(info);
        });
      }
    });
  }

  public async onceInitPublicData() {
    const info = await this.getSystemInfo();
    if (info === null) return;

    socketStore.dispatchEvent('public-data', info);
  }

  public onReset() {
    SystemPlugin.hasInitd = false;
  }

  public async getSystemInfo() {
    const info = {
      system: {
        ua: this.client?.getName(),
      },
      features: {},
    } as SpySystem.DataItem;

    const mp = getMPSDK();
    const sysInfo = mp.getSystemInfoSync();
    const settings = await promisifyMPApi(mp.getSetting)();
    info.mp = JSON.stringify(Object.assign(sysInfo, settings.authSetting));

    const processedByUser = this.$pageSpyConfig?.dataProcessor?.system?.(info);

    if (processedByUser === false) return null;
    return makeMessage('system', info);
  }
}
