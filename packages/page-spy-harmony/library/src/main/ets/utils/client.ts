import { SpyClient } from '../types';
import deviceInfo from '@ohos.deviceInfo';
import { DEVICE_INFO } from './constants';

export const combineName = ({
  osType,
  osVersion,
  browserType,
  browserVersion,
}: SpyClient.ClientInfo) => {
  // return `${osType}/${osVersion} ${browserType}/${browserVersion}`;
  return DEVICE_INFO;
};

export default class Client {
  static info: SpyClient.ClientInfo = {
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
    const ua = Client.info.ua || combineName(Client.info);
    const msg: SpyClient.DataItem = {
      sdk: Client.info.sdk,
      isDevTools: Client.info.isDevTools,
      ua,
      plugins: Client.plugins,
    };
    return msg;
  }
}
