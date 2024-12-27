import PageSpy, {
  setMPSDK,
  Client,
  type MPSDK,
  getMPSDK,
} from '@huolala-tech/page-spy-mp-base';
import { SpyClient } from '@huolala-tech/page-spy-types';

declare const wx: any;

setMPSDK(wx);

const info = wx.getSystemInfoSync();
const [osName, osVersion] = info.system.toLowerCase().split(' ');
PageSpy.client = new Client(
  {
    osType: (info.platform !== 'devtools' // NOTE: 小程序独有
      ? info.platform.toLowerCase()
      : osName) as SpyClient.OS,
    sdk: 'mp-wechat',
    browserType: 'mp-wechat',
    osVersion,
    browserVersion: info.version,
    isDevTools: info.platform === 'devtools',
    sdkVersion: PKG_VERSION,
  },
  info,
);

export default PageSpy;
