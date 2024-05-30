import { setMPSDK } from 'mp-base/src/utils';
import PageSpy from 'mp-base/src';
import Client from 'base/src/client';
import { SpyClient } from 'packages/page-spy-types';

declare const wx: MPSDK;

setMPSDK(wx);

const info = wx.getSystemInfoSync();
const [osName, osVersion] = info.system.toLowerCase().split(' ');
Client.info.osType = (
  info.platform !== 'devtools' // NOTE: 小程序独有
    ? info.platform.toLowerCase()
    : osName
) as SpyClient.OS;
Client.info.sdk = 'mp-wechat';
Client.info.browserType = 'mp-wechat';
Client.info.osVersion = osVersion;
Client.info.browserVersion = info.version;
Client.info.isDevTools = info.platform === 'devtools';

export default PageSpy;
