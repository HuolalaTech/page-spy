// eslint-disable no-case-declarations
import type { OnInitParams, PageSpyPlugin } from '@huolala-tech/page-spy-types';
import { NetworkProxyBase } from '@huolala-tech/page-spy-base/dist/network/base';
import XhrProxy from './proxy/xhr-proxy';
import FetchProxy from './proxy/fetch-proxy';
import { InitConfig } from '../../config';

export default class NetworkPlugin implements PageSpyPlugin {
  public name = 'NetworkPlugin';

  public xhrProxy: XhrProxy | null = null;

  public fetchProxy: FetchProxy | null = null;

  public static hasInitd = false;

  public onInit({ config }: OnInitParams<InitConfig>) {
    if (NetworkPlugin.hasInitd) return;
    NetworkPlugin.hasInitd = true;
    NetworkProxyBase.dataProcessor = config.dataProcessor.network;

    this.fetchProxy = new FetchProxy();
    this.xhrProxy = new XhrProxy();
  }

  public onReset() {
    this.fetchProxy?.reset();
    this.xhrProxy?.reset();
    NetworkPlugin.hasInitd = false;
  }
}
