// all use lower case for convenience in comparing.
export type OS =
  | 'windows'
  | 'ios'
  | 'ipad'
  | 'mac'
  | 'android'
  | 'linux'
  | 'harmony'
  | 'unknown';

export type MPType =
  | 'mp-wechat'
  | 'mp-qq'
  | 'mp-alipay'
  | 'mp-baidu'
  | 'mp-toutiao'
  | 'mp-douyin'
  | 'mp-lark'
  | 'mp-kuaishou'
  | 'mp-jd'
  | 'mp-toutiao-lt'
  | 'mp-douyin-lt'
  | 'mp-douyin-huoshan'
  | 'mp-xigua'
  | 'mp-ppx' // 皮皮虾
  | 'mp-dingtalk'
  | 'mp-xhs'
  | 'mp-uni'; // uni app 推出的小程序集成方案，类似 mpaas;

// all use lower case for convenience in comparing.
export type Browser =
  | 'wechat'
  | 'qq'
  | 'uc'
  | 'baidu'
  | 'edge'
  | 'chrome'
  | 'firefox'
  | 'safari'
  | 'react-native'
  | 'unknown'
  | MPType
  | 'uni-native'
  | 'harmony';

export type Framework = 'uniapp' | 'taro' | 'react-native' | 'unknown';

export type SDKType =
  | 'browser'
  | 'mp-wechat'
  | 'mp-alipay'
  | 'uniapp'
  | 'taro'
  | 'rn'
  | 'harmony'
  | 'unknown';

export interface ClientInfo {
  ua?: string;
  osType?: OS;
  osVersion?: string;
  browserType?: Browser;
  browserVersion?: string;
  framework?: Framework; // Currently only for miniprogram
  isDevTools?: boolean;
  sdk?: SDKType;
}

// The message type that will be sent over socket
export interface DataItem {
  ua?: string;
  isDevTools?: boolean;
  sdk?: SDKType;
  // Plugins enabled in PageSpy SDK
  plugins?: string[];
}
