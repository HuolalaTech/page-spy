import socketStore from 'page-spy-browser/src/helpers/socket';
import { makeMessage } from 'base/src/message';
import '../../deps/modernizr';
import { SpySystem, PageSpyPlugin } from '@huolala-tech/page-spy-types';
import { computeResult } from './feature';

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

  // eslint-disable-next-line class-methods-use-this
  public onInit() {
    if (SystemPlugin.hasInitd) return;
    SystemPlugin.hasInitd = true;

    socketStore.addListener('refresh', async ({ source }, reply) => {
      const { data } = source;
      if (data === 'system') {
        const msg = await SystemPlugin.getSystemInfo();
        socketStore.dispatchEvent('public-data', msg);
        reply(msg);
      }
    });
  }

  public onReset() {
    SystemPlugin.hasInitd = false;
  }

  private static async getSystemInfo() {
    const features = await computeResult();
    const msg = makeMessage('system', {
      system: {
        ua: navigator.userAgent,
      },
      features,
    } as SpySystem.DataItem);

    return msg;
  }
}
