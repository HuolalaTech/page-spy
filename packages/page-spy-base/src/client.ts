/* eslint-disable no-restricted-syntax */
import { SpyClient } from '@huolala-tech/page-spy-types';

export class Client {
  constructor(
    public info: SpyClient.ClientInfo = {
      // browserName and framework should be overwritten by package implementation\
      osType: 'unknown',
      osVersion: 'unknown',
      browserType: 'unknown',
      browserVersion: 'unknown',
      framework: 'unknown',
      isDevTools: false,
      sdk: 'unknown',
      sdkVersion: '0.0.0',
    },
    // the raw info from getSystemInfoSync or similar api, will be sent by system plugin
    public rawInfo?: Record<string, any>,
  ) {}

  plugins: string[] = [];

  makeClientInfoMsg() {
    const msg: SpyClient.DataItem = {
      sdk: this.info.sdk,
      isDevTools: this.info.isDevTools,
      ua: this.getName(),
      plugins: this.plugins,
    };
    return msg;
  }

  private _name: string = '';

  getName() {
    if (!this._name) {
      const { ua, osType, osVersion, browserType, browserVersion } = this.info;

      this._name =
        ua || `${osType}/${osVersion} ${browserType}/${browserVersion}`;
    }
    return this._name;
  }
}
