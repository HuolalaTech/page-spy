[page-spy-web]: https://github.com/HuolalaTech/page-spy-web.git 'page-spy-web'
[sdk-version]: https://harmony.blucas.me/badge/version/@huolala/page-spy-harmony
[sdk-size]: https://harmony.blucas.me/badge/size/@huolala/page-spy-harmony

# `@huolala/page-spy-harmony`

![SDK version][sdk-version]

<div align="center">
    <img src="https://pagespy.blucas.me/public/img/logo.svg" height="100" />
    <h1>PageSpy for HarmonyOS</h1>
    <p>PageSpy 是一款可以调试 Web / 小程序 / 鸿蒙等端的开源平台。</p>
    <a href="https://www.producthunt.com/posts/pagespy?utm_source=badge-featured&utm_medium=badge&utm_souce=badge-pagespy" target="_blank"><img src="https://api.producthunt.com/widgets/embed-image/v1/featured.svg?post_id=429852&theme=light" alt="PageSpy - Remote&#0032;debugging&#0032;as&#0032;seamless&#0032;as&#0032;local&#0032;debugging&#0046; | Product Hunt" height="36" /></a> <a href="https://news.ycombinator.com/item?id=38679798" target="_blank"><img src="https://hackernews-badge.vercel.app/api?id=38679798" alt="PageSpy - Remote&#0032;debugging&#0032;as&#0032;seamless&#0032;as&#0032;local&#0032;debugging&#0046; | Hacker News" height="36" /></a>
</div>

## 简介

`@huolala/page-spy-harmony` 是由货拉拉开源项目 [PageSpy][page-spy-web] 在鸿蒙端实现的 SDK。 PageSpy
用于本地开发调试、远程调试用户设备，支持调试 WEB / 小程序 / 鸿蒙等平台，更多细节内容介绍请参考 [主仓库][page-spy-web]。

## 版本兼容性

- `@huolala/page-spy-harmony@1.x`：基于 API 9 版本开发；
- `@huolala/page-spy-harmony@2.x`：基于 API 11 版本开发；

## 能力概览

### console 打印日志

![console 打印日志](https://pagespy.blucas.me/public/img/console.svg)

### 项目报错

![项目报错](https://pagespy.blucas.me/public/img/error.svg)

### 网络请求

![网络请求](https://pagespy.blucas.me/public/img/network.svg)

### 应用数据

![应用数据](https://pagespy.blucas.me/public/img/storage.svg)

## 开始使用

> 在引入 SDK 前请先部署 PageSpy 服务，部署方式请参考 [PageSpy 部署教程](https://github.com/HuolalaTech/page-spy-web/blob/main/README_ZH.md#如何使用)。

部署成功后，接下来需要在项目中引入 HAR SDK：

- 第一步在你的 HAP 项目目录下安装；

```bash
$ ohpm install @huolala/page-spy-harmony
```

- 第二步在项目中引入 SDK 并实例化；

```typescript
// 在你的 HAP 中引入 SDK 并实例化
// 本示例演示在 src/main/ets/Entry/EntryAbility.ts 文件中操作

import { PageSpy } from '@huolala/page-spy-harmony';
import axiosInstance from 'path/to/your/axios';

export default class EntryAbility extends UIAbility {
  onWindowStageCreate(windowStage: window.WindowStage) {
    new PageSpy({
      context: this.context,

      // PageSpy 服务的域名
      // 假设服务部署在 https://example.com 则填写 "example.com"
      api: '<your-pagespy-server-host>',

      // PageSpy 部署的服务是否 https 访问，默认为 true
      enableSSL: true,

      // 项目代码中 @ohos/axios 的实例或者类，用于查看网络请求信息
      axios: axiosInstance,
    });
  }
}
```

以上就是引入 PageSpy 的全部内容！之后请启动模拟器或设备，接着打开浏览器前往 PageSpy 服务就可以正式开启调试。
