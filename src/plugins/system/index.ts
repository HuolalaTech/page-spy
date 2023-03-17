import type PageSpyPlugin from 'src/plugins/index';
import { getRandomId } from 'src/utils';
import socketStore from 'src/utils/socket';
import { makeMessage, MESSAGE_TYPE } from 'src/utils/message';
import { parseUserAgent } from 'src/utils/ua';
import '../../deps/modernizr';
import { computeResult } from './feature';

window.Modernizr.addTest(
  'finally',
  Modernizr.promises && !!Promise.prototype.finally,
);
window.Modernizr.addTest(
  'iframe',
  Modernizr.sandbox && Modernizr.seamless && Modernizr.srcdoc,
);

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
      makeMessage(MESSAGE_TYPE.system, {
        id,
        system: {
          ua: navigator.userAgent,
          ...parseUserAgent(),
        },
        features,
      }),
    );
  }
}
