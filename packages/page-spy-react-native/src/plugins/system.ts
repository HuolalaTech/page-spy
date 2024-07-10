import { makeMessage, Client, combineName } from '@huolala-tech/page-spy-base';
import type { SpySystem, PageSpyPlugin } from '@huolala-tech/page-spy-types';
import socketStore from '../helpers/socket';

export default class SystemPlugin implements PageSpyPlugin {
  public name = 'SystemPlugin';

  public static hasInitd = false;

  // eslint-disable-next-line class-methods-use-this
  public onInit() {
    if (SystemPlugin.hasInitd) return;
    SystemPlugin.hasInitd = true;

    socketStore.addListener('refresh', ({ source }, reply) => {
      const { data } = source;
      if (data === 'system') {
        const msg = SystemPlugin.getSystemInfo();
        socketStore.dispatchEvent('public-data', msg);

        reply(msg);
      }
    });
  }

  public onReset() {
    SystemPlugin.hasInitd = false;
  }

  public static getSystemInfo() {
    const msg = makeMessage('system', {
      system: {
        ua: combineName(Client.info),
      },
      features: {},
    } as SpySystem.DataItem);

    return msg;
  }
}
