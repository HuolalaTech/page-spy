import { makeMessage } from '@huolala-tech/page-spy-base';
import '../../deps/modernizr';
import {
  SpySystem,
  PageSpyPlugin,
  OnInitParams,
} from '@huolala-tech/page-spy-types';
import socketStore from '../../helpers/socket';
import { computeResult } from './feature';
import { InitConfig } from '../../config';

window.Modernizr.addTest(
  'finally',
  Modernizr.promises && !!Promise.prototype.finally,
);
window.Modernizr.addTest(
  'reflect',
  'Reflect' in window &&
    typeof window.Reflect === 'object' &&
    typeof Reflect.has === 'function' &&
    [
      'apply',
      'construct',
      'defineProperty',
      'deleteProperty',
      'getOwnPropertyDescriptor',
      'getPrototypeOf',
      'has',
      'isExtensible',
      'ownKeys',
      'preventExtensions',
      'setPrototypeOf',
    ].every((i) => Reflect.has(Reflect, i)),
);

export default class SystemPlugin implements PageSpyPlugin {
  public name = 'SystemPlugin';

  public static hasInitd = false;

  public $pageSpyConfig: InitConfig | null = null;

  public onInit({ config }: OnInitParams<InitConfig>) {
    if (SystemPlugin.hasInitd) return;
    SystemPlugin.hasInitd = true;

    this.$pageSpyConfig = config;

    socketStore.addListener('refresh', async ({ source }, reply) => {
      const { data } = source;
      if (data === 'system') {
        const info = await SystemPlugin.getSystemInfo();
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

  public static async getSystemInfo() {
    const features = await computeResult();
    return {
      system: {
        ua: navigator.userAgent,
      },
      features,
    };
  }
}
