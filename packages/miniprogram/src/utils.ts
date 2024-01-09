import type { DeviceInfo } from 'base/types/lib/device';

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
};

export const getDeviceInfo = () => {
  const info = wx.getSystemInfoSync();
  return {
    osName:
      info.platform !== 'devtools' // NOTE: 小程序独有
        ? OSMap[info.platform]
        : info.system.split(' ')[0],
    osVersion: info.system.split(' ')[1],
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
