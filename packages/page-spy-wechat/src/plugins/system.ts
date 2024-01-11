import { getRandomId } from 'base/src';
import socketStore from 'page-spy-wechat/src/helpers/socket';
import { makeMessage, DEBUG_MESSAGE_TYPE } from 'base/src/message';
import type { SpySystem, PageSpyPlugin } from '@huolala-tech/page-spy-types';
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
