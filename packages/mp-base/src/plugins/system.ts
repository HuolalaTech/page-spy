import Device from 'mp-base/src/device';
import { getRandomId } from 'base/src';
import socketStore from 'mp-base/src/helpers/socket';
import { makeMessage } from 'base/src/message';
import type { SpySystem, PageSpyPlugin } from '@huolala-tech/page-spy-types';
import { combineName } from 'base/src/device';

export default class SystemPlugin implements PageSpyPlugin {
  public name = 'SystemPlugin';

  public static hasInitd = false;

  // eslint-disable-next-line class-methods-use-this
  public onInit() {
    if (SystemPlugin.hasInitd) return;
    SystemPlugin.hasInitd = true;

    const id = getRandomId();
    const deviceInfo = Device.info;
    socketStore.broadcastMessage(
      makeMessage('system', {
        id,
        system: {
          ua: combineName(deviceInfo),
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
