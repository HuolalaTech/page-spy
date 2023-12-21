import { getDeviceInfo } from './../../utils';
import type PageSpyPlugin from 'src/utils/plugin';
import { getRandomId } from 'src/utils';
import socketStore from 'miniprogram/helpers/socket';
import { makeMessage, DEBUG_MESSAGE_TYPE } from 'src/utils/message';
import '../../deps/modernizr';
import { SpySystem } from 'types';
// import { computeResult } from './feature';

// window.Modernizr.addTest(
//   'finally',
//   Modernizr.promises && !!Promise.prototype.finally,
// );
// window.Modernizr.addTest(
//   'reflect',
//   'Reflect' in window &&
//     typeof window.Reflect === 'object' &&
//     typeof Reflect.has === 'function' &&
//     [
//       'apply',
//       'construct',
//       'defineProperty',
//       'deleteProperty',
//       'getOwnPropertyDescriptor',
//       'getPrototypeOf',
//       'has',
//       'isExtensible',
//       'ownKeys',
//       'preventExtensions',
//       'setPrototypeOf',
//     ].every((i) => Reflect.has(Reflect, i)),
// );

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
          ua: `${deviceInfo.osName}/${deviceInfo.osVersion} MPWeChat/${deviceInfo.browserVersion}`, // PENDING: 获取小程序 ua，让服务端实现 navigator.userAgent,
          ...getDeviceInfo(),
        },
        // features,
      } as SpySystem.DataItem),
      false,
    );
  }
}
