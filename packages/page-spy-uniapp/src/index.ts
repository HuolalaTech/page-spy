import { setMPSDK } from 'mp-base/src/utils';
import PageSpy from 'mp-base/src';
import Device from 'mp-base/src/device';
import { SpyDevice } from 'packages/page-spy-types';
import { SocketStoreBase } from 'base/src/socket-base';

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
  live_stream: 'mp-huoshan',
  XiGua: 'mp-xigua',
  PPX: 'mp-ppx',
};

if (info.uniPlatform === 'mp-toutiao') {
  browserType = TOUTIAO_MAP[info.hostName] || browserType;
} else {
  browserType = HOST_MAP[info.uniPlatform] || browserType;
}

Device.info = {
  framework: 'uniapp',
  osType: info.osName.toLowerCase() as SpyDevice.OS,
  osVersion: info.osVersion,
  browserType,
  browserVersion: info.appVersion,
};

// Really disgusting... alipay mp has different message format even in uniapp...
SocketStoreBase.messageFilters.push((data) => {
  if (info.hostName === 'alipay') {
    return data.data;
  }
  return data;
});

export default PageSpy;
