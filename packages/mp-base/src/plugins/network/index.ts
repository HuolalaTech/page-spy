// eslint-disable no-case-declarations
import type { PageSpyPlugin } from '@huolala-tech/page-spy-types';
import RequestProxy from './proxy/request';

export default class NetworkPlugin implements PageSpyPlugin {
  public name = 'NetworkPlugin';

  public requestProxy: RequestProxy | null = null;

  public static hasInitd = false;

  public onInit() {
    if (NetworkPlugin.hasInitd) return;
    NetworkPlugin.hasInitd = true;

    this.requestProxy = new RequestProxy();
  }

  public onReset() {
    this.requestProxy?.reset();
    NetworkPlugin.hasInitd = false;
  }
}
