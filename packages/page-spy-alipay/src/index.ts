import PageSpy, {
  setMPSDK,
  utilAPI,
  Client,
  SocketStoreBase,
} from '@huolala-tech/page-spy-mp-base';
import { SpyClient } from '@huolala-tech/page-spy-types';

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

utilAPI.showActionSheet = (params) => {
  return my.showActionSheet({
    ...params,
    items: params.itemList,
    success: (res: { index: number }) => {
      params.success?.({
        tapIndex: res.index,
      });
    },
  });
};

const info = my.getSystemInfoSync();

PageSpy.client = new Client({
  sdk: 'mp-alipay',
  osType: info.platform.toLowerCase() as SpyClient.OS,
  browserType: 'mp-alipay',
  osVersion: info.system,
  browserVersion: info.version,
  sdkVersion: PKG_VERSION,
});

SocketStoreBase.messageFilters.push((data) => {
  return data.data;
});

export default PageSpy;
