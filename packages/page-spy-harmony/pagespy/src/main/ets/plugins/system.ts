import socketStore from '../helpers/socket';
import { PageSpyPlugin, SpySystem } from '../types';
import { getRandomId } from '../utils';
import { DEVICE_INFO } from '../utils/constants';
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
          ua: DEVICE_INFO,
        },
        features: {},
      } as SpySystem.DataItem),
      false,
    );
  }

  public onReset() {
    SystemPlugin.hasInitd = false;
  }
}
