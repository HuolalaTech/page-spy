[page-spy-web]: https://github.com/HuolalaTech/page-spy-web.git 'page-spy-web'
[coveralls-image]: https://coveralls.io/repos/github/HuolalaTech/page-spy/badge.svg?branch=main
[coveralls-url]: https://coveralls.io/github/HuolalaTech/page-spy?branch=main
[npm-image]: https://img.shields.io/npm/v/@huolala-tech/page-spy
[npm-url]: https://www.npmjs.com/package/@huolala-tech/page-spy
[minified-image]: https://img.shields.io/bundlephobia/min/@huolala-tech/page-spy
[minified-url]: https://unpkg.com/browse/@huolala-tech/page-spy/dist/index.min.js

<div align="center">
  <img src="./logo.svg" height="100" />

  <h1>Page Spy SDK</h1>
  <p>PageSpy 是一款远程调试网页的工具。</p>

[![Coverage Status][coveralls-image]][coveralls-url] [![NPM Package][npm-image]][npm-url] [![Minified size][minified-image]][minified-url]

<a href="https://www.producthunt.com/posts/pagespy?utm_source=badge-featured&utm_medium=badge&utm_souce=badge-pagespy" target="_blank"><img src="https://api.producthunt.com/widgets/embed-image/v1/featured.svg?post_id=429852&theme=light" alt="PageSpy - Remote&#0032;debugging&#0032;as&#0032;seamless&#0032;as&#0032;local&#0032;debugging&#0046; | Product Hunt" height="36" /></a> <a href="https://news.ycombinator.com/item?id=38679798" target="_blank"><img src="https://hackernews-badge.vercel.app/api?id=38679798" alt="PageSpy - Remote&#0032;debugging&#0032;as&#0032;seamless&#0032;as&#0032;local&#0032;debugging&#0046; | Hacker News" height="36" /></a>

[English](./README.md) | 中文

</div>

## 简介

这个仓库是 [HuolalaTech/page-spy-web][page-spy-web] 使用的 SDK。具体而言 SDK 负责收集页面信息；`page-spy-web` 消费收集的信息，对数据进行过滤和整理，并将其转换成一种标准格式，最后在页面上呈现。

## 使用

为了数据安全和你的方便，我们提供了完整的、开箱即用的使用方案。前往 [HuolalaTech/page-spy-web][page-spy-web] 阅读 “如何使用” 一节获取更多详细信息。

完成集成后，在浏览器中打开你的项目，页面左下角应该有一个控件（白底圆形的容器，包含 logo）。如果没有，请检查你的配置。

## 实例化参数

### Web

所有的参数都是可选的，下面是各个属性的说明及其默认值：

```ts
window.$pageSpy = new PageSpy(config?: InitConfig)

interface InitConfig {
  // SDK 会从引入的路径自动分析并决定 Server 的地址（api）和调试端的地址（clientOrigin）
  // 假设你从 https://example.com/page-spy/index.min.js 引入，那么 SDK 会在内部设置：
  //   - api: "example.com"
  //   - clientOrigin: "https://example.com"
  // 如果你的服务部署在别处，就需要在这里手动指定去覆盖。
  api?: string;
  clientOrigin?: string;

  // project 作为信息的一种聚合，可以在调试端房间列表进行搜索
  // 默认值 'default'
  project?: string;

  // title 供用户提供自定义参数，可以用于区分当前调试的客户端
  // 对应的信息显示在每个调试连接面板的「设备id」下方
  // 默认值 '--'
  title?: string;

  // 指示 SDK 初始化完成，是否自动在客户端左下角渲染「圆形白底带 Logo」的控件
  // 如果设置为 false, 可以调用 window.$pageSpy.render() 手动渲染
  // 默认值 true
  autoRender?: boolean;

  // 手动指定 PageSpy 服务的 scheme。
  // 这在 SDK 无法正确分析出 scheme 可以使用，例如 PageSpy 的浏览器插件
  // 是通过 chrome-extension://xxx/sdk/index.min.js 引入 SDK，这会
  // 被 SDK 解析成无效的 "chrome-extension://" 并回退到 ["http://", "ws://"]。
  //   - （默认）传值 undefined 或者 null：SDK 会自动分析；
  //   - 传递 boolean 值：
  //     - true：SDK 将通过 ["https://", "wss://"] 访问 PageSpy 服务
  //     - false：SDK 将通过 ["http://", "ws://"] 访问 PageSpy 服务
  enableSSL?: boolean | null;
}
```

### 小程序

除 `api` 外，其他参数都是可选的。

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
}

```

小程序更详细的说明请阅读 [小程序使用说明](https://github.com/HuolalaTech/page-spy/wiki/%E5%B0%8F%E7%A8%8B%E5%BA%8F%E4%BD%BF%E7%94%A8%E8%AF%B4%E6%98%8E)
