import PageSpyMPBase, {
  MPSocketWrapper,
  setCustomGlobal,
  setMPSDK,
  Client,
  psLog,
} from '@huolala-tech/page-spy-mp-base';
import { SpyClient, SpyMP } from '@huolala-tech/page-spy-types';

declare const tt: any;

class PageSpyTaro extends PageSpyMPBase {
  constructor(
    init: SpyMP.MPInitConfig & {
      taro: any;
    },
  ) {
    const { taro } = init;
    if (
      !taro ||
      typeof taro !== 'object' ||
      typeof taro.getEnv !== 'function'
    ) {
      throw Error('You must inject the Taro global object.');
    }
    setMPSDK(taro);

    const info = taro.getSystemInfoSync();

    const taroEnv = (taro as any).getEnv();

    let browserType: SpyClient.ClientInfo['browserType'] = 'unknown';
    let browserVersion = 'unknown';
    let osType: SpyClient.OS = 'unknown';
    let osVersion: string = 'unknown';

    const HOST_MAP: Record<string, SpyClient.Browser> = {
      WEAPP: 'mp-wechat',
      SWAN: 'mp-baidu',
      ALIPAY: 'mp-alipay',
      TT: 'mp-douyin',
      QQ: 'mp-wechat',
      JD: 'mp-jd',
    };

    // get browser type
    if (taroEnv === 'WEB') {
      browserType = 'unknown';
      psLog.warn(
        'This package is designed for mini program, please use @huolala-tech/page-spy-browser for web project.',
      );
    } else {
      browserType = HOST_MAP[taroEnv] || 'unknown';
    }

    // Taro has no unified system API, it just call api from each platform.
    // so we need to detect them separately.
    // alipay is special
    if (browserType === 'mp-alipay') {
      osType = info.platform.toLowerCase() as SpyClient.OS;
      osVersion = info.system!;
      browserVersion = info.version!;
      // Taro has a bug here for alipay that the 'multiple' option will override socket task.
      // So in taro, it's single all the time.
      MPSocketWrapper.isSingleSocket = true;
      // NOTE: in Taro, the message format is unified, so we don't need below code. But we still keep it here
      // to let you know. Look to the uniapp sdk.
      // SocketStoreBase.messageFilters.push((data) => {
      //   return data.data;
      // });
    } else {
      const arr = info.system?.split(' ');
      osType = (arr?.[0].toLowerCase() || 'unknown') as SpyClient.OS;
      osVersion = arr?.[1].toLowerCase() || 'unknown';
      browserVersion = info.version!;
    }

    // Some ali apps have to use single socket instance
    // For below 2 platforms, this option is always true for others, user can also set it manually on config option "singletonSocket".
    if (info.app === 'DingTalk' || info.app === 'mPaaS') {
      MPSocketWrapper.isSingleSocket = true;
    }

    // tt has blocked access to global object, we need to inject the global object with necessary apis.
    if (browserType === 'mp-douyin') {
      setCustomGlobal({
        getApp,
        getCurrentPages,
        tt,
        console,
      });
    }
    PageSpyMPBase.client = new Client(
      {
        sdk: 'taro',
        osType,
        osVersion,
        browserType,
        browserVersion,
        isDevTools: info.platform === 'devtools', // alipay cannot detect devtools, so here is always false for alipay.
        sdkVersion: PKG_VERSION,
      },
      info,
    );
    super(init);
  }
}

export default PageSpyTaro;
