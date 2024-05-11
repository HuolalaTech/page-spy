import type { SpyDevice } from '@huolala-tech/page-spy-types';
import { Platform } from 'react-native';
import { OS } from '@huolala-tech/page-spy-types/lib/device';

const osMap: Record<typeof Platform.OS, OS> = {
  android: 'android',
  ios: 'ios',
  windows: 'windows',
  macos: 'mac',
  web: 'unknown', // this should not happen.
};

const rnv = Platform.constants.reactNativeVersion;

export default class Device {
  static info: SpyDevice.DeviceInfo = {
    osType: osMap[Platform.OS] || 'unknown',
    osVersion: String(Platform.Version),
    browserType: 'react-native',
    browserVersion: `${rnv.major}.${rnv.minor}.${rnv.patch}${
      rnv.prerelease ? '-' + rnv.prerelease : ''
    }`,
    framework: 'react-native',
    isDevTools: false,
  };
}
