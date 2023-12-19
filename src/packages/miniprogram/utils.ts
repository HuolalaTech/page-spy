import { DeviceInfo } from 'types/lib/device';

type CallbackParams<R = any, E = any> = {
  [key: string]: any;
} & AsyncCallback<R, E>;

// TODO: 这里补类型
export const promisifyMPApi = (api: (params: any) => any) => {
  return (params: Record<string, any>) => {
    return new Promise((resolve, reject) => {
      api({
        ...params,
        success(res: any) {
          resolve(res);
        },
        fail(err: any) {
          reject(err);
        },
      });
    });
  };
};

const OSMap: Record<string, DeviceInfo['osName']> = {
  ios: 'iPhone',
  android: 'Android',
  windows: 'Windows',
  mac: 'Mac',
  devtools: 'Unknown',
};

export const getDeviceInfo = () => {
  const info = wx.getSystemInfoSync();
  return {
    osName: OSMap[info.platform],
    osVersion: info.system,
    browserName: 'WeChat',
    browserVersion: info.version,
  } as DeviceInfo;
};
