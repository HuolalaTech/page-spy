[page-spy-web]: https://github.com/HuolalaTech/page-spy-web.git 'page-spy-web'
[coveralls-image]: https://coveralls.io/repos/github/HuolalaTech/page-spy/badge.svg?branch=main
[coveralls-url]: https://coveralls.io/github/HuolalaTech/page-spy?branch=main
[npm-image]: https://img.shields.io/npm/v/@huolala-tech/page-spy
[npm-url]: https://www.npmjs.com/package/@huolala-tech/page-spy
[minified-image]: https://img.shields.io/bundlephobia/min/@huolala-tech/page-spy
[minified-url]: https://unpkg.com/browse/@huolala-tech/page-spy/dist/index.min.js

[English](./README.md) | 中文

<p align="center">
  <img src="./logo.svg" height="120" />
</p>

<h1 align="center">
PageSpy

[![Coverage Status][coveralls-image]][coveralls-url] [![NPM Package][npm-image]][npm-url] [![Minified size][minified-image]][minified-url]

</h1>

> 一款远程调试网页的工具。

## 简介

这个仓库和 [HuolalaTech/page-spy-web][page-spy-web] 相互配合，具体而言 `page-spy` 负责收集页面信息；`page-spy-web` 消费收集的信息，对数据进行过滤和整理，并将其转换成一种标准格式，最后在页面上呈现。

## 使用

为了数据安全和你的方便，我们提供了完整的、开箱即用的使用方案。前往 [HuolalaTech/page-spy-web][page-spy-web] 阅读 “如何使用” 一节获取更多详细信息。

完成集成后，在浏览器中打开你的项目，页面左下角应该有一个控件（白底圆形的容器，包含 logo）。如果没有，请检查你的配置。
