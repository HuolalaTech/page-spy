[npm-image]: https://img.shields.io/npm/v/@huolala-tech/page-spy-react-native?logo=npm&label=version
[npm-url]: https://www.npmjs.com/package/@huolala-tech/page-spy-react-native
[minified-image]: https://img.shields.io/bundlephobia/min/@huolala-tech/page-spy-react-native
[minified-url]: https://unpkg.com/browse/@huolala-tech/page-spy-react-native/dist/esm/index.min.js

[English](./README.md) | 中文

# `@huolala-tech/page-spy-react-native`

[![SDK version][npm-image]][npm-url]
[![SDK size][minified-image]][minified-url]

> 这个 SDK 用于调试 React Native APP.

> [!NOTE]
> 如果用 React Native 编译为 Web，推荐使用 [`@huolala-tech/page-spy-browser`](https://www.npmjs.com/package/@huolala-tech/page-spy-browser)

## 使用

```ts
import PageSpy from '@huolala-tech/page-spy-react-native'

const pageSpy = new PageSpy(config?: InitConfig)
```

## `InitConfig` 定义

除了 `api` 参数是必须明确指定，其他参数都是可选的：

```ts
const pageSpy = new PageSpy(config?: InitConfig)

interface InitConfig {
  // server 地址域名，必填。
  // 例子："example.com"
  api: string;

  // project 作为信息的一种聚合，可以在调试端房间列表进行搜索
  // 默认值 'default'
  project?: string;

  // title 供用户提供自定义参数，可以用于区分当前调试的客户端
  // 对应的信息显示在每个调试连接面板的「设备id」下方
  // 默认值 '--'
  title?: string;

  // 手动指定 PageSpy 服务的 scheme。
  // 注意小程序除了开发环境外，强制要求使用 https 和 wss 协议，所以：
  //  - （默认）传值 undefined 或者 null：自动转换为 TRUE;
  //  - true：SDK 将通过 ["https://", "wss://"] 访问 PageSpy 服务;
  //  - false：SDK 将通过 ["http://", "ws://"] 访问 PageSpy 服务;
  enableSSL?: boolean | null;

  // PageSpy 所有内置插件默认开启，可以按需禁用指定插件。
  disabledPlugins?: (InternalPlugins | string)[];

}

type InternalPlugins =
  | 'ConsolePlugin'
  | 'ErrorPlugin'
  | 'StoragePlugin'
  | 'SystemPlugin';

```

## 常见问题

### https

IOS 和 Android 默认仅支持 https，如果你部署的 page-spy 服务没有开启 https，会导致无法连接 page-spy 服务。https://reactnative.dev/docs/network

### storage

本 SDK 没有包含 storage 插件，因为最新版的 React Native 也移除了默认的存储 API。

对于官方推荐的 `@react-native-async-storage/async-storage`，我们提供了独立的插件：[`@huolala-tech/page-spy-plugin-rn-async-storage`](https://www.npmjs.com/package/@huolala-tech/page-spy-plugin-rn-async-storage)
