import Device from 'mp-base/src/device';
import { getRandomId, psLog } from 'base/src';
import socketStore from 'mp-base/src/helpers/socket';
import { makeMessage, DEBUG_MESSAGE_TYPE } from 'base/src/message';
import type { SpySystem, PageSpyPlugin } from '@huolala-tech/page-spy-types';

export default class SystemPlugin implements PageSpyPlugin {
  public name = 'SystemPlugin';

  public static hasInitd = false;

  // eslint-disable-next-line class-methods-use-this
  public async onCreated() {
    if (SystemPlugin.hasInitd) return;
    SystemPlugin.hasInitd = true;

    const id = getRandomId();
    const deviceInfo = Device.info;
    socketStore.broadcastMessage(
      makeMessage(DEBUG_MESSAGE_TYPE.SYSTEM, {
        id,
        system: {
          ua: deviceInfo.browserName, // TODO: for different mp type
          ...deviceInfo,
        },
        features: {},
      } as SpySystem.DataItem),
      false,
    );
  }
}
