/* eslint-disable no-restricted-syntax */

import { SpyDevice } from '@huolala-tech/page-spy-types';
import { DeviceInfo } from '@huolala-tech/page-spy-types/lib/device';

const browsers = {
  WeChat: /MicroMessenger\/([\d.]+)/,
  QQ: /(?:QQBrowser|MQQBrowser|QQ)\/([\d.]+)/,
  UC: /(?:UCBrowser|UCBS)\/([\d.]+)/,
  Baidu: /(?:BIDUBrowser|baiduboxapp)[/]?([\d.]*)/,
  Edge: /Edg(?:e|A|iOS)?\/([\d.]+)/,
  Chrome: /(?:Chrome|CriOS)\/([\d.]+)/,
  Firefox: /(?:Firefox|FxiOS)\/([\d.]+)/,
  Safari: /Version\/([\d.]+).*Safari/,
};

const platforms = {
  Windows: /Windows NT ([\d_.]+)/,
  iPhone: /iPhone OS ([\d_.]+)/,
  iPad: /iPad.*OS ([\d_.]+)/,
  Mac: /Mac OS X ([\d_.]+)/,
  Android: /Android ([\d_.]+)/,
  Linux: /Linux/,
};

export function parseUserAgent(
  uaString: string = window.navigator.userAgent,
): DeviceInfo {
  let osType: SpyDevice.OS = 'unknown';
  let osVersion = 'unknown';
  let browserType: SpyDevice.Browser = 'unknown';
  let browserVersion = 'unknown';

  // 判断操作系统
  for (const platform in platforms) {
    if (Object.prototype.hasOwnProperty.call(platforms, platform)) {
      const reg = platforms[platform as keyof typeof platforms];
      const match = uaString.match(reg);
      if (match) {
        osType = platform as SpyDevice.OS;
        osVersion = match[1]?.replaceAll('_', '.');
        break;
      }
    }
  }

  // 判断浏览器
  for (const browser in browsers) {
    if (Object.prototype.hasOwnProperty.call(browsers, browser)) {
      const match = uaString.match(browsers[browser as keyof typeof browsers]);
      if (match) {
        browserType = browser as SpyDevice.Browser;
        // eslint-disable-next-line prefer-destructuring
        browserVersion = match[1];
        break;
      }
    }
  }

  return {
    osType,
    osVersion,
    browserType,
    browserVersion,
  };
}

export const combineName = ({
  osType,
  osVersion,
  browserType,
  browserVersion,
}: DeviceInfo) => `${osType}/${osVersion} ${browserType}/${browserVersion}`;
