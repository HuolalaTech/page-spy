import socketStore from 'page-spy-browser/src/helpers/socket';
import type { PageSpyPlugin } from '@huolala-tech/page-spy-types';
import { makeMessage, DEBUG_MESSAGE_TYPE } from 'base/src/message';
import { PUBLIC_DATA } from 'base/src/message/debug-type';

export default class PagePlugin implements PageSpyPlugin {
  public name = 'PagePlugin';

  public static hasInitd = false;

  // eslint-disable-next-line class-methods-use-this
  public onInit() {
    if (PagePlugin.hasInitd) return;
    PagePlugin.hasInitd = true;

    socketStore.addListener(DEBUG_MESSAGE_TYPE.REFRESH, ({ source }, reply) => {
      const { data } = source;
      if (data === 'page') {
        const msg = PagePlugin.collectHtml();
        socketStore.dispatchEvent(PUBLIC_DATA, msg);
        reply(msg);
      }
    });
  }

  public onReset() {
    PagePlugin.hasInitd = false;
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
