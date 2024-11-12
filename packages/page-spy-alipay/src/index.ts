import PageSpyMPBase, {
  setMPSDK,
  utilAPI,
} from '@huolala-tech/page-spy-mp-base';
import { Client, SocketStoreBase } from '@huolala-tech/page-spy-base';
import { SpyClient, SpyMP } from '@huolala-tech/page-spy-types';

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

class PageSpy extends PageSpyMPBase {
  constructor(init: SpyMP.MPInitConfig) {
    super(init, {
      sdk: 'mp-alipay',
      osType: info.platform.toLowerCase() as SpyClient.OS,
      browserType: 'mp-alipay',
      osVersion: info.system,
      browserVersion: info.version,
      sdkVersion: PKG_VERSION,
    });
  }
}

SocketStoreBase.messageFilters.push((data) => {
  return data.data;
});

export default PageSpy;
