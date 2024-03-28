import { setMPSDK } from 'mp-base/src/utils';
import PageSpy from 'mp-base/src';
import Device from 'mp-base/src/device';
import { SpyDevice } from 'packages/page-spy-types';

declare const wx: MPSDK;

setMPSDK(wx);

const info = wx.getSystemInfoSync();
const [osName, osVersion] = info.system.toLowerCase().split(' ');
Device.info.osType = (
  info.platform !== 'devtools' // NOTE: 小程序独有
    ? info.platform.toLowerCase()
    : osName
) as SpyDevice.OS;
Device.info.browserType = 'mp-wechat';
Device.info.osVersion = osVersion;
Device.info.browserVersion = info.version;
Device.info.isDevTools = info.platform === 'devtools';

export default PageSpy;
