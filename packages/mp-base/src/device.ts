import type { SpyDevice } from '@huolala-tech/page-spy-types';
import { getMPSDK } from './utils';

export default class Device {
  static info: SpyDevice.DeviceInfo = {
    // browserName and framework should be overwritten by upper implementations
    osName: 'unknown',
    osVersion: 'unknown',
    browserName: 'unknown',
    browserVersion: 'unknown',
    framework: 'unknown',
  };

  static getInfo() {
    const info = getMPSDK().getSystemInfoSync();
    const [osName, osVersion] = info.system.split(' ');
    Device.info.osName = (
      info.platform !== 'devtools' // NOTE: 小程序独有
        ? info.platform.toLowerCase()
        : osName
    ) as SpyDevice.OS;

    Device.info.osVersion = osVersion;

    Device.info.browserVersion = info.version;

    return Device.info;
  }
}
