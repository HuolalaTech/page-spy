[page-spy-web]: https://github.com/HuolalaTech/page-spy-web.git 'page-spy-web'
[ci-build-image]: https://img.shields.io/github/actions/workflow/status/HuolalaTech/page-spy/coveralls.yml?logo=github&label=build
[ci-build-url]: https://github.com/HuolalaTech/page-spy/actions/workflows/coveralls.yml
[coveralls-image]: https://img.shields.io/coverallsCoverage/github/HuolalaTech/page-spy?label=coverage&logo=coveralls
[coveralls-url]: https://coveralls.io/github/HuolalaTech/page-spy?branch=main
[welcome-pr]: https://img.shields.io/badge/PRs-welcome-green

<div align="center">
  <img src="./logo.svg" height="100" />

  <h1>Page Spy SDKs</h1>
  <p>PageSpy is a developer platform for debugging web page.</p>

[![CI build status][ci-build-image]][ci-build-url]
[![Coverage Status][coveralls-image]][coveralls-url]
![Welcome PR][welcome-pr]

<a href="https://www.producthunt.com/posts/pagespy?utm_source=badge-featured&utm_medium=badge&utm_souce=badge-pagespy" target="_blank"><img src="https://api.producthunt.com/widgets/embed-image/v1/featured.svg?post_id=429852&theme=light" alt="PageSpy - Remote&#0032;debugging&#0032;as&#0032;seamless&#0032;as&#0032;local&#0032;debugging&#0046; | Product Hunt" height="36" /></a> <a href="https://news.ycombinator.com/item?id=38679798" target="_blank"><img src="https://hackernews-badge.vercel.app/api?id=38679798" alt="PageSpy - Remote&#0032;debugging&#0032;as&#0032;seamless&#0032;as&#0032;local&#0032;debugging&#0046; | Hacker News" height="36" /></a>

English | [中文](./README_ZH.md)

</div>

## What's this

This repo is the SDK which be used in [HuolalaTech/page-spy-web][page-spy-web], where [SDKs](./packages) collects information and [HuolalaTech/page-spy-web][page-spy-web] consumes and filters, organizes, and converts information into a standardized format, which is then showed on the page.

## Usage

For data security and your convenience, we provide a complete and out-of-box solution. Read the "How to use" section in the [HuolalaTech/page-spy-web][page-spy-web]
to get more detail.

## SDKs

| Repo                                                                                               | Platform       | Status |
| -------------------------------------------------------------------------------------------------- | -------------- | ------ |
| [`@huolala-tech/page-spy-types`](./packages/page-spy-types/)                                       | _Common types_ | Done   |
| [`@huolala-tech/page-spy-browser`](./packages/page-spy-browser/)                                   | Web            | Done   |
| [`@huolala-tech/page-spy-wechat`](./packages/page-spy-wechat/)                                     | Wechat         | Done   |
| [`@huolala-tech/page-spy-alipay`](./packages/page-spy-alipay/)                                     | Alipay         | Done   |
| [`@huolala-tech/page-spy-uniapp`](./packages/page-spy-uniapp/)                                     | UniApp         | Done   |
| [`@huolala-tech/page-spy-taro`](./packages/page-spy-taro/)                                         | Taro           | Done   |
| [`@huolala-tech/page-spy-rn`](./packages/page-spy-rn/)                                             | React Native   | Done   |
| [`@huolala/page-spy-harmony`](https://ohpm.openharmony.cn/#/cn/detail/@huolala%2Fpage-spy-harmony) | Huawei Harmony | Done   |

## Official plugins

> Plugin document: [PageSpy plugins](./docs/plugin.md)

| Repo                                                                                   | Platform | Type                              | Status |
| -------------------------------------------------------------------------------------- | -------- | --------------------------------- | ------ |
| [`@huolala-tech/page-spy-plugin-rrweb`](./packages/page-spy-plugin-rrweb/)             | Web      | Record the DOM mutations          | Done   |
| [`@huolala-tech/page-spy-plugin-data-harbor`](./packages/page-spy-plugin-data-harbor/) | Web      | Offline caching data and download | Done   |
