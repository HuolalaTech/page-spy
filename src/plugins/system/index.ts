import type PageSpyPlugin from 'src/plugins/index';
import { getRandomId } from 'src/utils';
import socketStore from 'src/utils/socket';
import { makeMessage, DEBUG_MESSAGE_TYPE } from 'src/utils/message';
import { parseUserAgent } from 'src/utils/ua';
import '../../deps/modernizr';
import { SpySystem } from 'types';
import { computeResult } from './feature';

/* c8 ignore start */
window.Modernizr.addTest(
  'finally',
  Modernizr.promises && !!Promise.prototype.finally,
);
window.Modernizr.addTest(
  'iframe',
  Modernizr.sandbox && Modernizr.seamless && Modernizr.srcdoc,
);
/* c8 ignore stop */

export default class SystemPlugin implements PageSpyPlugin {
  name: string;

  constructor() {
    this.name = 'SystemPlugin';
  }

  // eslint-disable-next-line class-methods-use-this
  async onCreated() {
    const id = getRandomId();
    const features = await computeResult();
    socketStore.broadcastMessage(
      makeMessage(DEBUG_MESSAGE_TYPE.SYSTEM, {
        id,
        system: {
          ua: navigator.userAgent,
          ...parseUserAgent(),
        },
        features,
      } as SpySystem.DataItem),
      false,
    );
  }
}
