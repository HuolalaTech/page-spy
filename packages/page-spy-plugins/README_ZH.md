[npm-image]: https://img.shields.io/npm/v/@huolala-tech/page-spy-browser?logo=npm&label=version
[npm-url]: https://www.npmjs.com/package/@huolala-tech/page-spy-browser
[minified-image]: https://img.shields.io/bundlephobia/min/@huolala-tech/page-spy-browser
[minified-url]: https://unpkg.com/browse/@huolala-tech/page-spy-browser/dist/iife/index.min.js

[English](./README.md) | 中文

# `@huolala-tech/page-spy-browser`

[![SDK version][npm-image]][npm-url]
[![SDK size][minified-image]][minified-url]

> 这个 SDK 用于调试浏览器环境的网页应用。

## 使用

```html
<!-- 1. 在你的 html 中插入脚本 -->
<script
  crossorigin="anonymous"
  src="https://<your-host>/page-spy/index.min.js"
></script>

<!-- 2. 实例化 -->
<script>
  window.$pageSpy = new PageSpy(config?: InitConfig)
</script>
```

完成集成后，在浏览器中打开你的项目，页面左下角应该有一个控件（白底圆形的容器，包含 logo）。如果没有，请检查你的配置。

## `InitConfig` 定义

所有参数都是可选的：

```ts
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
