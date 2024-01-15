export type OS =
  | 'windows'
  | 'ios'
  | 'ipad'
  | 'mac'
  | 'android'
  | 'linux'
  | 'harmony'
  | 'unknown';

export type MPType = 'mp-wechat' | 'mp-alipay' | 'mp-douyin';

export type Browser =
  | 'wechat'
  | 'qq'
  | 'uc'
  | 'baidu'
  | 'edge'
  | 'chrome'
  | 'firefox'
  | 'safari'
  | 'unknown'
  | MPType;

export type Framework = 'uniapp' | 'taro' | 'unknown';

export interface DeviceInfo {
  osName: OS;
  osVersion: string;
  browserName: Browser;
  browserVersion: string;
  framework?: Framework; // Currently only for miniprogram
}
