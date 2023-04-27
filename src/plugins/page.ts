import SocketStore from 'src/utils/socket';
import type PageSpyPlugin from 'src/plugins/index';
import { makeMessage, DEBUG_MESSAGE_TYPE } from 'src/utils/message';

export default class PagePlugin implements PageSpyPlugin {
  name = 'PagePlugin';

  // eslint-disable-next-line class-methods-use-this
  onCreated() {
    window.addEventListener('load', () => {
      const msg = PagePlugin.collectHtml();
      SocketStore.broadcastMessage(msg);
    });
    SocketStore.addListener(DEBUG_MESSAGE_TYPE.REFRESH, ({ source }, reply) => {
      const { data } = source;
      if (data === 'page') {
        const msg = PagePlugin.collectHtml();
        reply(msg);
      }
    });
  }

  static collectHtml() {
    const originHtml = document.documentElement.outerHTML;
    const msg = makeMessage(DEBUG_MESSAGE_TYPE.PAGE, {
      html: originHtml,
      location: window.location,
    });
    return msg;
  }
}
