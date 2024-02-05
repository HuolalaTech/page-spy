import { setMPSDK } from 'mp-base/src/utils';
import PageSpy from 'mp-base/src';
import Device from 'mp-base/src/device';
import { SpyDevice } from 'packages/page-spy-types';
import { SocketStoreBase } from 'base/src/socket-base';
// reassign the global.mp to uni

declare const my: MPSDK;

setMPSDK(my);

const info = my.getSystemInfoSync();
Device.info.osType = info.platform.toLowerCase() as SpyDevice.OS;
Device.info.browserType = 'mp-alipay';
Device.info.osVersion = info.system;
Device.info.browserVersion = info.version;

SocketStoreBase.messageFilters.push((data) => {
  return data.data;
});

export default PageSpy;
