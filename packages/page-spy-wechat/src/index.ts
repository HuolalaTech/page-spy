import { setMPSDK } from 'mp-base/src/utils';
import PageSpy from 'mp-base/src';
import Device from 'mp-base/src/device';
import { SpyDevice } from 'packages/page-spy-types';
// reassign the global.mp to uni

// Object.defineProperty(getGlobal(), 'mp', {
//   value: uni,
//   configurable: false,
//   writable: false,
// });

declare const wx: MPSDK;

setMPSDK(wx);

// Device.getInfo = function() {
//   const info = wx.getSystemInfoSync();
//   return {
//     browserName: 'mp-wechat', // TODO: TEMP
//     osName: info.osName.toLowerCase() as SpyDevice.OS,
//     osVersion: info.osVersion,
//     browserVersion: info.appVersion
//   }
// };

export default PageSpy;
