export type OS =
  | 'Windows'
  | 'iPhone'
  | 'iPad'
  | 'Mac'
  | 'Android'
  | 'Linux'
  | 'Unknown';

export type MPType = 'MPWeChat' | 'MPAliPay' | 'MPDouYin';

export type Browser =
  | 'WeChat'
  | 'QQ'
  | 'UC'
  | 'Baidu'
  | 'Edge'
  | 'Chrome'
  | 'Firefox'
  | 'Safari'
  | 'Unknown'
  | MPType;

export type Framework = 'UniApp' | 'Taro' | 'Unknown';

export interface DeviceInfo {
  osName: OS;
  osVersion: string;
  browserName: Browser;
  browserVersion: string;
  framework?: Framework; // Currently only for miniprogram
}
