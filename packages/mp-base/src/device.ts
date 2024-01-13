import type { SpyDevice } from '@huolala-tech/page-spy-types';
import { mp } from './utils';

const OSMap: Record<string, SpyDevice.DeviceInfo['osName']> = {
  ios: 'iPhone',
  android: 'Android',
  windows: 'Windows',
  mac: 'Mac',
};

export default class Device {
  static info: SpyDevice.DeviceInfo = {
    // browserName and framework should be overwritten by upper implementations
    osName: 'Unknown',
    osVersion: 'Unknown',
    browserName: 'Unknown',
    browserVersion: 'Unknown',
    framework: 'Unknown',
  };

  static getInfo() {
    const info = mp.getSystemInfoSync();
    const [osName, osVersion] = info.system.split(' ');
    Device.info.osName =
      info.platform !== 'devtools' // NOTE: 小程序独有
        ? OSMap[info.platform.toLowerCase()]
        : (osName as SpyDevice.OS);

    Device.info.osVersion = osVersion;

    Device.info.browserVersion = info.version;

    return Device.info;
  }
}
