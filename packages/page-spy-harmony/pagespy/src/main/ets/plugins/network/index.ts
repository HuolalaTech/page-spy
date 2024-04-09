import type { PageSpyPlugin } from '../../types';
import HttpProxy from './http';

export default class NetworkPlugin implements PageSpyPlugin {
  public name = 'NetworkPlugin';

  public httpProxy: HttpProxy | null = null;

  public static hasInitd = false;

  public onInit() {
    if (NetworkPlugin.hasInitd) return;
    NetworkPlugin.hasInitd = true;

    this.httpProxy = new HttpProxy();
  }

  public onReset() {
    this.httpProxy.reset();
    NetworkPlugin.hasInitd = false;
  }
}
