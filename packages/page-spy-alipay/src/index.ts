import { setMPSDK, utilAPI } from 'mp-base/src/utils';
import PageSpy from 'mp-base/src';
import Device from 'mp-base/src/device';
import { SpyDevice } from 'packages/page-spy-types';
import { SocketStoreBase } from 'base/src/socket-base';
// reassign the global.mp to uni

declare const my: any;

setMPSDK(my);

// alipay toxic storage api...
utilAPI.getStorage = (key: string) => {
  const res = my.getStorageSync({ key });
  if (res.success) {
    return res.data;
  }
  return undefined;
};

utilAPI.setStorage = (key: string, value: any) => {
  return my.setStorageSync({ key, data: value });
};

utilAPI.removeStorage = (key) => {
  return my.removeStorageSync({ key });
};

const info = my.getSystemInfoSync();
Device.info.osType = info.platform.toLowerCase() as SpyDevice.OS;
Device.info.browserType = 'mp-alipay';
Device.info.osVersion = info.system;
Device.info.browserVersion = info.version;
// Device.info.framework is unknown by default

SocketStoreBase.messageFilters.push((data) => {
  return data.data;
});

export default PageSpy;
