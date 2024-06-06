import socketStore from '../helpers/socket';
import { PageSpyPlugin, SpySystem } from '../types';
import { getRandomId } from '../utils';
import Client, { combineName } from '../utils/client';
import { makeMessage } from '../utils/message';

export default class SystemPlugin implements PageSpyPlugin {
  public name = 'SystemPlugin';

  public static hasInitd = false;

  public onInit() {
    if (SystemPlugin.hasInitd) return;
    SystemPlugin.hasInitd = true;

    const id = getRandomId();
    socketStore.broadcastMessage(
      makeMessage('system', {
        id,
        system: {
          ua: combineName(Client.info),
        },
        features: {},
      } as SpySystem.DataItem),
    );
  }

  public onReset() {
    SystemPlugin.hasInitd = false;
  }
}
