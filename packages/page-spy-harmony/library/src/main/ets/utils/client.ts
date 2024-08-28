import { SpyClient } from '../types';
import deviceInfo from '@ohos.deviceInfo';
import { DEVICE_INFO } from './constants';

export default class Client {
  static info: SpyClient.ClientInfo = {
    // 硬编码 ua
    ua: DEVICE_INFO,
    osType: 'harmony',
    osVersion: deviceInfo.osFullName,
    browserType: 'harmony',
    browserVersion: `${deviceInfo.marketName.replace(/\s/g, '_')}/API_${deviceInfo.sdkApiVersion}`,
    framework: 'unknown',
    isDevTools: false,
    sdk: 'harmony',
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
