import type PageSpyPlugin from 'src/utils/plugin';
import { getRandomId } from 'src/utils';
import socketStore from 'miniprogram/helpers/socket';
import { makeMessage, DEBUG_MESSAGE_TYPE } from 'src/utils/message';
import { SpySystem } from 'types/miniprogram';
import { getDeviceInfo } from '../utils';

export default class SystemPlugin implements PageSpyPlugin {
  public name = 'SystemPlugin';

  public static hasInitd = false;

  // eslint-disable-next-line class-methods-use-this
  public async onCreated() {
    if (SystemPlugin.hasInitd) return;
    SystemPlugin.hasInitd = true;

    const id = getRandomId();
    const deviceInfo = getDeviceInfo();
    socketStore.broadcastMessage(
      makeMessage(DEBUG_MESSAGE_TYPE.SYSTEM, {
        id,
        system: {
          ua: 'mp-wechat',
          ...deviceInfo,
        },
        features: {},
      } as SpySystem.DataItem),
      false,
    );
  }
}
