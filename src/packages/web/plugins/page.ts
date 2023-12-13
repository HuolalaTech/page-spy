import SocketStore from 'web/helpers/socket';
import type PageSpyPlugin from 'src/utils/plugin';
import { makeMessage, DEBUG_MESSAGE_TYPE } from 'src/utils/message';

export default class PagePlugin implements PageSpyPlugin {
  public name = 'PagePlugin';

  public static hasInitd = false;

  // eslint-disable-next-line class-methods-use-this
  public onCreated() {
    if (PagePlugin.hasInitd) return;
    PagePlugin.hasInitd = true;

    SocketStore.addListener(DEBUG_MESSAGE_TYPE.REFRESH, ({ source }, reply) => {
      const { data } = source;
      if (data === 'page') {
        const msg = PagePlugin.collectHtml();
        reply(msg);
      }
    });
  }

  private static collectHtml() {
    const originHtml = document.documentElement.outerHTML;
    const msg = makeMessage(DEBUG_MESSAGE_TYPE.PAGE, {
      html: originHtml,
      location: window.location,
    });
    return msg;
  }
}
