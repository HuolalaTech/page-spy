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

    this.onceInitPublicData();
    socketStore.addListener('refresh', async ({ source }, reply) => {
      const { data } = source;
      if (data === 'system') {
        const info = await this.getSystemInfo();
        if (info === null) return;

        reply(info);
      }
    });
    socketStore.addListener('harbor-clear', () => {
      this.onceInitPublicData();
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

  private _cache: SpySystem.DataItem | null = null;

  public async getSystemInfo() {
    if (!this._cache) {
      const features = await computeResult();
      this._cache = {
        system: {
          ua: navigator.userAgent,
        },
        features,
      } as SpySystem.DataItem;
    }

    const processedByUser = this.$pageSpyConfig?.dataProcessor?.system?.(
      this._cache,
    );

    if (processedByUser === false) return null;
    return makeMessage('system', this._cache);
  }
}
