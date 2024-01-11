[page-spy-web]: https://github.com/HuolalaTech/page-spy-web.git 'page-spy-web'
[coveralls-image]: https://coveralls.io/repos/github/HuolalaTech/page-spy/badge.svg?branch=main
[coveralls-url]: https://coveralls.io/github/HuolalaTech/page-spy?branch=main
[npm-image]: https://img.shields.io/npm/v/@huolala-tech/page-spy
[npm-url]: https://www.npmjs.com/package/@huolala-tech/page-spy
[minified-image]: https://img.shields.io/bundlephobia/min/@huolala-tech/page-spy
[minified-url]: https://unpkg.com/browse/@huolala-tech/page-spy/dist/index.min.js

<div align="center">
  <img src="./logo.svg" height="100" />

  <h1>Page Spy SDKs</h1>
  <p>PageSpy 是一款远程调试网页的工具。</p>

[![Coverage Status][coveralls-image]][coveralls-url] [![NPM Package][npm-image]][npm-url] [![Minified size][minified-image]][minified-url]

<a href="https://www.producthunt.com/posts/pagespy?utm_source=badge-featured&utm_medium=badge&utm_souce=badge-pagespy" target="_blank"><img src="https://api.producthunt.com/widgets/embed-image/v1/featured.svg?post_id=429852&theme=light" alt="PageSpy - Remote&#0032;debugging&#0032;as&#0032;seamless&#0032;as&#0032;local&#0032;debugging&#0046; | Product Hunt" height="36" /></a> <a href="https://news.ycombinator.com/item?id=38679798" target="_blank"><img src="https://hackernews-badge.vercel.app/api?id=38679798" alt="PageSpy - Remote&#0032;debugging&#0032;as&#0032;seamless&#0032;as&#0032;local&#0032;debugging&#0046; | Hacker News" height="36" /></a>

[English](./README.md) | 中文

</div>

## 简介

这个仓库是 [HuolalaTech/page-spy-web][page-spy-web] 使用的 SDK。具体而言 [SDKs]('./packages') 负责收集页面信息；[HuolalaTech/page-spy-web][page-spy-web] 消费收集的信息，对数据进行过滤和整理，并将其转换成一种标准格式，最后在页面上呈现。

## 使用

为了数据安全和你的方便，我们提供了完整的、开箱即用的使用方案。前往 [HuolalaTech/page-spy-web][page-spy-web] 阅读 “如何使用” 一节获取更多详细信息。

## SDKs

| Type             | Repo                                                             | Status    |
| ---------------- | ---------------------------------------------------------------- | --------- |
| Common types     | [`@huolala-tech/page-spy-types`](./packages/page-spy-types/)     | Pending   |
| Web SDK          | [`@huolala-tech/page-spy-browser`](./packages/page-spy-browser/) | Pending   |
| Wechat sdk       | [`@huolala-tech/page-spy-wechat`](./packages/page-spy-wechat/)   | Pending   |
| uniApp sdk       | `@huolala-tech/page-spy-uniapp`                                  | Not Start |
| Taro sdk         | `@huolala-tech/page-spy-taro`                                    | Not Start |
| React Native sdk | `@huolala-tech/page-spy-rn`                                      | Not Start |
