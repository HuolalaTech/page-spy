// eslint-disable no-case-declarations
import type { PageSpyPlugin } from 'base/types/index';
import RequestProxy from './proxy/request';

export default class NetworkPlugin implements PageSpyPlugin {
  public name = 'NetworkPlugin';

  public requestProxy: RequestProxy | null = null;

  public static hasInitd = false;

  public onCreated() {
    if (NetworkPlugin.hasInitd) return;
    NetworkPlugin.hasInitd = true;

    this.requestProxy = new RequestProxy();
  }
}
