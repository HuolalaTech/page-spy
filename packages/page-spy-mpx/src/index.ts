import { setCustomGlobal, setMPSDK, utilAPI } from 'mp-base/src/utils';
import PageSpy from 'mp-base/src';
import Client from 'base/src/client';
import { SocketStoreBase } from 'base/src/socket-base';
import { psLog } from 'base/src';
import { MPSocketWrapper } from 'mp-base/src/helpers/socket';
import { SpyClient, SpyMP } from 'packages/page-spy-types';

declare const __mpx_mode__: string;
declare let wx: any;
declare let my: any;
declare let tt: any;
declare let qq: any;
declare let swan: any;

class PageSpyMpx extends PageSpy {
  constructor(init: SpyMP.MPInitConfig) {
    let platformKey = wx;

    if (__mpx_mode__ === 'ali') {
      platformKey = my;
    } else if (__mpx_mode__ === 'tt') {
      platformKey = tt;
    } else if (__mpx_mode__ === 'qq') {
      platformKey = qq;
    } else if (__mpx_mode__ === 'swan') {
      platformKey = swan;
    }

    setMPSDK(platformKey);

    const info = platformKey.getSystemInfoSync() as {
      app: string;
      platform: string;
      system: string;
      version: string;
    };

    let browserType: SpyClient.ClientInfo['browserType'] = 'unknown';
    let browserVersion = 'unknown';
    let osType: SpyClient.OS = 'unknown';
    let osVersion: string = 'unknown';

    const HOST_MAP: Record<string, SpyClient.Browser> = {
      wx: 'mp-wechat',
      ali: 'mp-alipay',
      tt: 'mp-douyin',
      qq: 'mp-qq',
      swan: 'mp-baidu',
    };

    // get browser type
    if (__mpx_mode__ === 'web') {
      browserType = 'unknown';
      psLog.warn(
        'This package is designed for mini program, please use @huolala-tech/page-spy-browser for web project.',
      );
    } else {
      browserType = HOST_MAP[__mpx_mode__] || 'unknown';
    }

    // Mpx has no unified system API, it just call api from each platform.
    // so we need to detect them separately.
    // alipay is special
    if (__mpx_mode__ === 'ali') {
      osType = info.platform.toLowerCase() as SpyClient.OS;
      osVersion = info.system!;
      browserVersion = info.version!;
    } else {
      const arr = info.system?.split(' ');
      osType = (arr?.[0].toLowerCase() || 'unknown') as SpyClient.OS;
      osVersion = arr?.[1].toLowerCase() || 'unknown';
      browserVersion = info.version!;
    }

    if (__mpx_mode__ === 'ali') {
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
    }

    Client.info = {
      framework: 'mpx',
      sdk: 'mpx',
      osType,
      osVersion,
      browserType,
      browserVersion,
      isDevTools: info.platform === 'devtools', // alipay cannot detect devtools, so here is always false for alipay.
    };

    // Some ali apps have to use single socket instance
    // For below 2 platforms, this option is always true for others, user can also set it manually on config option "singletonSocket".
    if (__mpx_mode__ === 'ali') {
      if (info.app === 'DingTalk' || info.app === 'mPaaS') {
        MPSocketWrapper.isSingleSocket = true;
      }
    }

    // tt has blocked access to global object, we need to inject the global object with necessary apis.
    if (__mpx_mode__ === 'tt') {
      setCustomGlobal({
        getApp,
        getCurrentPages,
        tt,
        console,
      });
    }

    // Really disgusting... alipay mp has different message format even in mpx...
    if (__mpx_mode__ === 'ali') {
      SocketStoreBase.messageFilters.push((data) => {
        return data.data;
      });
    }

    super(init);
  }
}

export default PageSpyMpx;
