// eslint-disable no-case-declarations
import type { PageSpyPlugin } from '@huolala-tech/page-spy-types';
import XhrProxy from './proxy/xhr-proxy';

// In react native, fetch() is built with whatwg-fetch, which is a polyfill of fetch using XMLHttpRequest. So we only need to proxy XMLHttpRequest.

export default class NetworkPlugin implements PageSpyPlugin {
  public name = 'NetworkPlugin';

  public xhrProxy: XhrProxy | null = null;

  public static hasInitd = false;

  public onInit() {
    if (NetworkPlugin.hasInitd) return;
    NetworkPlugin.hasInitd = true;

    this.xhrProxy = new XhrProxy();
  }

  public onReset() {
    this.xhrProxy?.reset();
    NetworkPlugin.hasInitd = false;
  }
}
