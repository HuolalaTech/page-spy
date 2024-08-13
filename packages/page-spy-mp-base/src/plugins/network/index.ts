// eslint-disable no-case-declarations
import type {
  OnInitParams,
  PageSpyPlugin,
  SpyMP,
} from '@huolala-tech/page-spy-types';
import { NetworkProxyBase } from '@huolala-tech/page-spy-base';
import RequestProxy from './proxy/request';

export default class NetworkPlugin implements PageSpyPlugin {
  public name = 'NetworkPlugin';

  public requestProxy: RequestProxy | null = null;

  public static hasInitd = false;

  public onInit({ config }: OnInitParams<SpyMP.MPInitConfig>) {
    if (NetworkPlugin.hasInitd) return;
    NetworkPlugin.hasInitd = true;
    NetworkProxyBase.dataProcessor = config.dataProcessor.network;

    this.requestProxy = new RequestProxy();
  }

  public onReset() {
    this.requestProxy?.reset();
    NetworkPlugin.hasInitd = false;
  }
}
