/* eslint-disable no-restricted-syntax */
import { SpyClient } from '@huolala-tech/page-spy-types';

export class Client {
  static info: SpyClient.ClientInfo = {
    // browserName and framework should be overwritten by package implementation\
    osType: 'unknown',
    osVersion: 'unknown',
    browserType: 'unknown',
    browserVersion: 'unknown',
    framework: 'unknown',
    isDevTools: false,
    sdk: 'browser',
  };

  static plugins: string[] = [];

  static makeClientInfoMsg() {
    const msg: SpyClient.DataItem = {
      sdk: Client.info.sdk,
      isDevTools: Client.info.isDevTools,
      ua: Client.getName(),
      plugins: Client.plugins,
    };
    return msg;
  }

  private static _name: string;

  static getName() {
    if (!Client._name) {
      const { ua, osType, osVersion, browserType, browserVersion } =
        Client.info;

      Client._name =
        ua || `${osType}/${osVersion} ${browserType}/${browserVersion}`;
    }
    return Client._name;
  }
}
