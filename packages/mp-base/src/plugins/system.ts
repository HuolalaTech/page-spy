import Device from 'mp-base/src/device';
import { getRandomId } from 'base/src';
import socketStore from 'mp-base/src/helpers/socket';
import { makeMessage, DEBUG_MESSAGE_TYPE } from 'base/src/message';
import type { SpySystem, PageSpyPlugin } from '@huolala-tech/page-spy-types';

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
      makeMessage(DEBUG_MESSAGE_TYPE.SYSTEM, {
        id,
        system: {
          ua: deviceInfo.browserName,
          ...deviceInfo,
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
