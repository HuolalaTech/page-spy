[English](./README.md) | 中文

# `@huolala-tech/page-spy-uniapp`

> 这个 SDK 用于调试 UniAPP 开发的小程序.

## 使用

```ts
import PageSpy from '@huolala-tech/page-spy-uniapp'

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

  // 在 release 环境禁用。
  //  - true (Default)：默认仅允许 PageSpy 在开发版 ("develop") 和体验版 ("trial") 使用
  //  - false：允许正式版里开启
  disabledOnProd?: boolean;
}

```

小程序更详细的说明请阅读 [小程序使用说明](https://github.com/HuolalaTech/page-spy/wiki/%E5%B0%8F%E7%A8%8B%E5%BA%8F%E4%BD%BF%E7%94%A8%E8%AF%B4%E6%98%8E)。
