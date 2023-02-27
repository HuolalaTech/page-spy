import SocketStore from 'src/utils/socket';
import type PageSpyPlugin from 'src/plugins/index';
import { makeMessage, MESSAGE_TYPE } from 'src/utils/message';

export default class PagePlugin implements PageSpyPlugin {
  name = 'PagePlugin';

  // eslint-disable-next-line class-methods-use-this
  onCreated() {
    window.addEventListener('load', () => {
      const msg = PagePlugin.collectHtml();
      SocketStore.broadcastMessage(msg);
    });
    SocketStore.addListener(MESSAGE_TYPE.refresh, ({ source }, reply) => {
      const { data } = source;
      if (data === 'page') {
        const msg = PagePlugin.collectHtml();
        reply(msg);
      }
    });
  }

  static collectHtml() {
    const originHtml = document.documentElement.outerHTML;
    const msg = makeMessage(MESSAGE_TYPE.page, {
      html: originHtml,
    });
    return msg;
  }
}
