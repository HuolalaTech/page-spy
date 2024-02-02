import { setMPSDK } from 'mp-base/src/utils';
import PageSpy from 'mp-base/src';
import Device from 'mp-base/src/device';
import { SpyDevice } from 'packages/page-spy-types';
import { SocketStoreBase } from 'base/src/socket-base';
import { psLog } from 'base/src';
import { MPSocketWrapper } from 'mp-base/src/helpers/socket';

declare const uni: any;

setMPSDK(uni);

const info = uni.getSystemInfoSync() as {
  osName: string;
  osVersion: string;
  appVersion: string;
  hostName: string;
  uniPlatform: string;
};

let browserType: SpyDevice.DeviceInfo['browserType'] = 'unknown';

const HOST_MAP: Record<string, SpyDevice.Browser> = {
  'mp-weixin': 'mp-wechat',
};

const TOUTIAO_MAP: Record<string, SpyDevice.Browser> = {
  Toutiao: 'mp-toutiao',
  Douyin: 'mp-douyin',
  news_article_lite: 'mp-toutiao-lt',
  douyin_lite: 'mp-douyin-lt',
  live_stream: 'mp-douyin-huoshan',
  XiGua: 'mp-xigua',
  PPX: 'mp-ppx',
};

// get browser type
if (info.uniPlatform === 'web') {
  browserType = 'unknown';
  psLog.warn(
    'This package is designed for mini program, please use @huolala-tech/page-spy-browser for web project.',
  );
} else if (info.uniPlatform === 'mp-toutiao') {
  browserType = TOUTIAO_MAP[info.hostName] || 'mp-toutiao';
} else {
  browserType = HOST_MAP[info.uniPlatform] || info.uniPlatform;
}

Device.info = {
  framework: 'uniapp',
  osType: info.osName.toLowerCase() as SpyDevice.OS,
  osVersion: info.osVersion,
  browserType,
  browserVersion: info.appVersion,
};

// Some ali apps have to use single socket instance
// This detection only works on simulator, on real device, it depends on config option "singletonSocket"
if (
  info.uniPlatform === 'mp-alipay' &&
  (info.hostName === 'DingTalk' || info.hostName === 'mPaaS')
) {
  MPSocketWrapper.isSingleSocket = true;
}

// Really disgusting... alipay mp has different message format even in uniapp...
SocketStoreBase.messageFilters.push((data) => {
  if (info.hostName === 'alipay') {
    return data.data;
  }
  return data;
});

export default PageSpy;
