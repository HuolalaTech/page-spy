import socketStore from 'page-spy-browser/src/helpers/socket';
import type { PageSpyPlugin } from '@huolala-tech/page-spy-types';
import { makeMessage, DEBUG_MESSAGE_TYPE } from 'base/src/message';

export default class PagePlugin implements PageSpyPlugin {
  public name = 'PagePlugin';

  public static hasInitd = false;

  // eslint-disable-next-line class-methods-use-this
  public onCreated() {
    if (PagePlugin.hasInitd) return;
    PagePlugin.hasInitd = true;

    socketStore.addListener(DEBUG_MESSAGE_TYPE.REFRESH, ({ source }, reply) => {
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
