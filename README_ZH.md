[page-spy-web]: https://github.com/HuolalaTech/page-spy-web.git 'page-spy-web'
[ci-build-image]: https://img.shields.io/github/actions/workflow/status/HuolalaTech/page-spy/coveralls.yml?logo=github&label=build
[ci-build-url]: https://github.com/HuolalaTech/page-spy/actions/workflows/coveralls.yml
[coveralls-image]: https://img.shields.io/coverallsCoverage/github/HuolalaTech/page-spy?label=coverage&logo=coveralls
[coveralls-url]: https://coveralls.io/github/HuolalaTech/page-spy?branch=main
[welcome-pr]: https://img.shields.io/badge/PRs-welcome-green

<div align="center">
  <img src="./logo.svg" height="100" />

  <h1>Page Spy SDKs</h1>
  <p>PageSpy 是一款远程调试网页的工具。</p>

[![CI build status][ci-build-image]][ci-build-url]
[![Coverage Status][coveralls-image]][coveralls-url]
![Welcome PR][welcome-pr]

<a href="https://www.producthunt.com/posts/pagespy?utm_source=badge-featured&utm_medium=badge&utm_souce=badge-pagespy" target="_blank"><img src="https://api.producthunt.com/widgets/embed-image/v1/featured.svg?post_id=429852&theme=light" alt="PageSpy - Remote&#0032;debugging&#0032;as&#0032;seamless&#0032;as&#0032;local&#0032;debugging&#0046; | Product Hunt" height="36" /></a> <a href="https://news.ycombinator.com/item?id=38679798" target="_blank"><img src="https://hackernews-badge.vercel.app/api?id=38679798" alt="PageSpy - Remote&#0032;debugging&#0032;as&#0032;seamless&#0032;as&#0032;local&#0032;debugging&#0046; | Hacker News" height="36" /></a>

[English](./README.md) | 中文

</div>

## 简介

这个仓库是 [HuolalaTech/page-spy-web][page-spy-web] 使用的 SDK。具体而言 [SDKs](./packages) 负责收集页面信息；[HuolalaTech/page-spy-web][page-spy-web] 消费收集的信息，对数据进行过滤和整理，并将其转换成一种标准格式，最后在页面上呈现。

## 使用

为了数据安全和你的方便，我们提供了完整的、开箱即用的使用方案。前往 [HuolalaTech/page-spy-web][page-spy-web] 阅读 “如何使用” 一节获取更多详细信息。

## SDKs

| Repo                                                                                               | Platform       | Status |
| -------------------------------------------------------------------------------------------------- | -------------- | ------ |
| [`@huolala-tech/page-spy-types`](./packages/page-spy-types/)                                       | _Common_       | Done   |
| [`@huolala-tech/page-spy-browser`](./packages/page-spy-browser/)                                   | Web            | Done   |
| [`@huolala-tech/page-spy-wechat`](./packages/page-spy-wechat/)                                     | Wechat         | Done   |
| [`@huolala-tech/page-spy-alipay`](./packages/page-spy-alipay/)                                     | Alipay         | Done   |
| [`@huolala-tech/page-spy-uniapp`](./packages/page-spy-uniapp/)                                     | UniApp         | Done   |
| [`@huolala-tech/page-spy-taro`](./packages/page-spy-taro/)                                         | Taro           | Done   |
| [`@huolala-tech/page-spy-rn`](./packages/page-spy-rn/)                                             | React Native   | Done   |
| [`@huolala/page-spy-harmony`](https://ohpm.openharmony.cn/#/cn/detail/@huolala%2Fpage-spy-harmony) | Huawei Harmony | Done   |

## 官方插件

> 插件文档：[PageSpy 插件](./docs/plugin_zh.md)

| Repo                                                                                   | Platform | Type                        | Status |
| -------------------------------------------------------------------------------------- | -------- | --------------------------- | ------ |
| [`@huolala-tech/page-spy-plugin-rrweb`](./packages/page-spy-plugin-rrweb/)             | Web      | 监听 DOM 更新，记录操作轨迹 | Done   |
| [`@huolala-tech/page-spy-plugin-data-harbor`](./packages/page-spy-plugin-data-harbor/) | Web      | 离线缓存数据，支持下载日志  | Done   |
