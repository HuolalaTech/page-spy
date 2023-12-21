export type OS =
  | 'Windows'
  | 'iPhone'
  | 'iPad'
  | 'Mac'
  | 'Android'
  | 'Linux'
  | 'Unknown';
export type Browser =
  | 'WeChat'
  | 'QQ'
  | 'UC'
  | 'Baidu'
  | 'Edge'
  | 'Chrome'
  | 'Firefox'
  | 'Safari'
  | 'MPWeChat'
  | 'Unknown';

export interface DeviceInfo {
  osName: OS;
  osVersion: string;
  browserName: Browser;
  browserVersion: string; // TODO 加入小程序，这里是不是要加个 非浏览器的枚举
}
