// eslint-disable no-case-declarations
import type { PageSpyPlugin } from '@huolala-tech/page-spy-types';
import XhrProxy from './proxy/xhr-proxy';
import FetchProxy from './proxy/fetch-proxy';

export default class NetworkPlugin implements PageSpyPlugin {
  public name = 'NetworkPlugin';

  public xhrProxy: XhrProxy | null = null;
  public fetchProxy: FetchProxy | null = null;

  public static hasInitd = false;

  public onInit() {
    if (NetworkPlugin.hasInitd) return;
    NetworkPlugin.hasInitd = true;

    this.fetchProxy = new FetchProxy();
    this.xhrProxy = new XhrProxy();
  }

  public onReset() {
    this.fetchProxy?.reset();
    this.xhrProxy?.reset();
    NetworkPlugin.hasInitd = false;
  }
}
