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
};
Device.info = {
  framework: 'uniapp',
  osName: info.osName.toLowerCase() as SpyDevice.OS,
  osVersion: info.osVersion,
  browserName: 'mp-wechat', // TODO: TEMP
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
