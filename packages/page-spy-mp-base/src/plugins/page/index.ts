import socketStore from '../../helpers/socket';
import { getRandomId, makeMessage } from '@huolala-tech/page-spy-base';
import type {
  SpyMessage,
  PageSpyPlugin,
  SpyMPPage,
} from '@huolala-tech/page-spy-types';
import type { MPPageInfo } from '@huolala-tech/page-spy-types/lib/mp-page';

export interface CompNode {
  id: any;
  getData: () => Record<string, any>;
  parentId?: any;
  children?: CompNode[];
}

export default class MPPagePlugin implements PageSpyPlugin {
  public name: string = 'MPPagePlugin';

  public static hasInitd = false;

  private proxiedPages: RawPageInfo[] = [];

  private debounceFlag = false;

  static getPageId(pageInstance: RawPageInfo) {
    if (!pageInstance.__pageSpyId__) {
      pageInstance.__pageSpyId__ = getRandomId();
    }
    return pageInstance.__pageSpyId__;
  }

  processPagesInfo = () => {
    const pages = getCurrentPages();
    const newProxied: RawPageInfo[] = [];
    this.proxiedPages.forEach((pp) => {
      if (pages.includes(pp)) {
        newProxied.push(pp);
      }
    });

    const res = pages.map((page) => {
      if (!newProxied.includes(page)) {
        // proxy the setData function.
        // when called, send the pages info with debounce.
        const originSetData = page.setData;
        page.setData = (data) => {
          // if already has flag, leave to it.
          if (!this.debounceFlag) {
            this.debounceFlag = true;
            setTimeout(() => {
              this.sendPagesData();
            });
          }
          originSetData(data);
        };
        newProxied.push(page);
      }
      return {
        id: MPPagePlugin.getPageId(page),
        route: page.route,
        // options: page.options,
        data: page.data,
      } as MPPageInfo;
    });
    this.proxiedPages.splice(0, this.proxiedPages.length, ...newProxied);
    return res;
  };

  public onInit() {
    this.listenRefreshEvent();
  }

  public onReset() {
    MPPagePlugin.hasInitd = false;
  }

  sendPagesData() {
    const pages = this.processPagesInfo();
    this.sendMsg({ pages });
  }

  /* c8 ignore start */
  private listenRefreshEvent() {
    // get page stack
    socketStore.addListener('refresh', async ({ source }) => {
      const { data } = source;
      if (data === 'page') {
        this.sendPagesData();
      }
    });
  }

  private sendMsg(info: SpyMPPage.DataItem) {
    // TODO
    const data = makeMessage('page', info);
    socketStore.dispatchEvent('public-data', data);
    // The user wouldn't want to get the stale data, so here we set the 2nd parameter to true.
    socketStore.broadcastMessage(data, true);
  }
}
