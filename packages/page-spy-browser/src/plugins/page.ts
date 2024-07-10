import type { PageSpyPlugin } from '@huolala-tech/page-spy-types';
import { makeMessage } from '@huolala-tech/page-spy-base';
import socketStore from '../helpers/socket';

export default class PagePlugin implements PageSpyPlugin {
  public name = 'PagePlugin';

  public static hasInitd = false;

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

  public static collectHtml() {
    const originHtml = document.documentElement.outerHTML;
    const msg = makeMessage('page', {
      html: originHtml,
      location: window.location,
    });
    return msg;
  }
}
