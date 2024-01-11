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
  <p>PageSpy is a developer platform for debugging web page.</p>

[![Coverage Status][coveralls-image]][coveralls-url] [![NPM Package][npm-image]][npm-url] [![Minified size][minified-image]][minified-url]

<a href="https://www.producthunt.com/posts/pagespy?utm_source=badge-featured&utm_medium=badge&utm_souce=badge-pagespy" target="_blank"><img src="https://api.producthunt.com/widgets/embed-image/v1/featured.svg?post_id=429852&theme=light" alt="PageSpy - Remote&#0032;debugging&#0032;as&#0032;seamless&#0032;as&#0032;local&#0032;debugging&#0046; | Product Hunt" height="36" /></a> <a href="https://news.ycombinator.com/item?id=38679798" target="_blank"><img src="https://hackernews-badge.vercel.app/api?id=38679798" alt="PageSpy - Remote&#0032;debugging&#0032;as&#0032;seamless&#0032;as&#0032;local&#0032;debugging&#0046; | Hacker News" height="36" /></a>

English | [中文](./README_ZH.md)

</div>

## What's this

This repo is the SDK which be used in [HuolalaTech/page-spy-web][page-spy-web], where [SDKs]('./packages') collects information and [HuolalaTech/page-spy-web][page-spy-web] consumes and filters, organizes, and converts information into a standardized format, which is then showed on the page.

## Usage

For data security and your convenience, we provide a complete and out-of-box solution. Read the "How to use" section in the [HuolalaTech/page-spy-web][page-spy-web]
to get more detail.

## SDKs

| Type         | Repo                                                             | Status    |
| ------------ | ---------------------------------------------------------------- | --------- |
| Common types | [`@huolala-tech/page-spy-types`](./packages/page-spy-types/)     | Pending   |
| Web SDK      | [`@huolala-tech/page-spy-browser`](./packages/page-spy-browser/) | Pending   |
| Wechat sdk   | [`@huolala-tech/page-spy-wechat`](./packages/page-spy-wechat/)   | Pending   |
| uniApp sdk   | `@huolala-tech/page-spy-uniapp`                                  | Not Start |
| Taro sdk     | `@huolala-tech/page-spy-taro`                                    | Not Start |
| React Native | `@huolala-tech/page-spy-rn`                                      | Not Start |
