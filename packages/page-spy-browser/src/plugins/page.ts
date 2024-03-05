import socketStore from 'page-spy-browser/src/helpers/socket';
import type { PageSpyPlugin } from '@huolala-tech/page-spy-types';
import { makeMessage } from 'base/src/message';

export default class PagePlugin implements PageSpyPlugin {
  public name = 'PagePlugin';

  public static hasInitd = false;

  // eslint-disable-next-line class-methods-use-this
  public onInit() {
    if (PagePlugin.hasInitd) return;
    PagePlugin.hasInitd = true;

    socketStore.addListener('refresh', ({ source }, reply) => {
      const { data } = source;
      if (data === 'page') {
        const msg = PagePlugin.collectHtml();
        socketStore.dispatchEvent('public-data', msg);
        reply(msg);
      }
    });
  }

  public onReset() {
    PagePlugin.hasInitd = false;
  }

  private static collectHtml() {
    const originHtml = document.documentElement.outerHTML;
    const msg = makeMessage('page', {
      html: originHtml,
      location: window.location,
    });
    return msg;
  }
}
