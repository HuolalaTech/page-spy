import type { SpyDevice } from '@huolala-tech/page-spy-types';

export default class Device {
  static info: SpyDevice.DeviceInfo = {
    // browserName and framework should be overwritten by package implementation
    osType: 'unknown',
    osVersion: 'unknown',
    browserType: 'unknown',
    browserVersion: 'unknown',
    framework: 'unknown',
    isDevTools: false,
  };
}
