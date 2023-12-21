import { DeviceInfo } from 'types/lib/device';

type CallbackParams<R = any, E = any> = {
  [key: string]: any;
} & AsyncCallback<R, E>;

// PENDING: 这里补泛型
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
  devtools: 'Unknown', // TODO： 小程序独有的
};

export const getDeviceInfo = () => {
  const info = wx.getSystemInfoSync();
  return {
    osName:
      info.platform !== 'devtools'
        ? OSMap[info.platform]
        : info.system.split(' ')[0],
    osVersion: info.system,
    browserName: 'MPWeChat',
    browserVersion: info.version,
  } as DeviceInfo;
};

export const joinQuery = (args: Record<string, unknown>) => {
  const arr: string[] = [];
  Object.entries(args).forEach(([k, v]) => {
    arr.push(`${k}=${v}`);
  });
  return arr.join('&');
};
