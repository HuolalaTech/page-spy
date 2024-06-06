import type { InitConfig, OnInitParams, PageSpyPlugin } from '../../types';
import { psLog } from '../../utils';
import AxiosProxy from './axios';

export default class NetworkPlugin implements PageSpyPlugin {
  public name = 'NetworkPlugin';

  public axiosProxy: AxiosProxy | null = null;

  public static hasInitd = false;

  public onInit({ config }: OnInitParams<InitConfig>) {
    const { axios } = config;
    if (!axios) {
      psLog.warn(`Please pass "axios" option to enable ${this.name}`);
      return;
    }

    if (NetworkPlugin.hasInitd) return;
    NetworkPlugin.hasInitd = true;

    this.axiosProxy = new AxiosProxy(axios);
  }

  public onReset() {
    this.axiosProxy.reset();
    NetworkPlugin.hasInitd = false;
  }
}
