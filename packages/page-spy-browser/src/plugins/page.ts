import type { OnInitParams, PageSpyPlugin } from '@huolala-tech/page-spy-types';
import { makeMessage } from '@huolala-tech/page-spy-base';
import socketStore from '../helpers/socket';
import { InitConfig } from '../config';

export default class PagePlugin implements PageSpyPlugin {
  public name = 'PagePlugin';

  public static hasInitd = false;

  public $pageSpyConfig: InitConfig | null = null;

  public onInit({ config }: OnInitParams<InitConfig>) {
    if (PagePlugin.hasInitd) return;
    PagePlugin.hasInitd = true;

    this.$pageSpyConfig = config;

    socketStore.addListener('refresh', ({ source }, reply) => {
      const { data } = source;
      if (data === 'page') {
        const html = PagePlugin.collectHtml();
        const processedByUser =
          this.$pageSpyConfig?.dataProcessor?.page?.(html);
        if (processedByUser === false) return;

        const msg = makeMessage('page', html);
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
    return {
      html: originHtml,
      location: window.location,
    };
  }
}
