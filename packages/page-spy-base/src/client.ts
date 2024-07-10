/* eslint-disable no-restricted-syntax */
import { SpyClient } from '@huolala-tech/page-spy-types';

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
): SpyClient.ClientInfo {
  let osType: SpyClient.OS = 'unknown';
  let osVersion = 'unknown';
  let browserType: SpyClient.Browser = 'unknown';
  let browserVersion = 'unknown';

  // 判断操作系统
  for (const platform in platforms) {
    if (Object.prototype.hasOwnProperty.call(platforms, platform)) {
      const reg = platforms[platform as keyof typeof platforms];
      const match = uaString.match(reg);
      if (match) {
        osType = platform as SpyClient.OS;
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
        browserType = browser as SpyClient.Browser;
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
}: SpyClient.ClientInfo) =>
  `${osType}/${osVersion} ${browserType}/${browserVersion}`;

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
