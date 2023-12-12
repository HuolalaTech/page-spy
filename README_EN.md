[page-spy-web]: https://github.com/HuolalaTech/page-spy-web.git 'page-spy-web'
[coveralls-image]: https://coveralls.io/repos/github/HuolalaTech/page-spy/badge.svg?branch=main
[coveralls-url]: https://coveralls.io/github/HuolalaTech/page-spy?branch=main
[npm-image]: https://img.shields.io/npm/v/@huolala-tech/page-spy
[npm-url]: https://www.npmjs.com/package/@huolala-tech/page-spy
[minified-image]: https://img.shields.io/bundlephobia/min/@huolala-tech/page-spy
[minified-url]: https://unpkg.com/browse/@huolala-tech/page-spy/dist/index.min.js

English | [中文](./README.md)

<p align="center">
  <img src="./logo.svg" height="120" />
</p>

<h1 align="center">
PageSpy

[![Coverage Status][coveralls-image]][coveralls-url] [![NPM Package][npm-image]][npm-url] [![Minified size][minified-image]][minified-url]

</h1>

> A developer tool for debugging remote web page.

## What's this

This repo and [HuolalaTech/page-spy-web][page-spy-web] work together, where `page-spy` collects information and `page-spy-web` consumes and filters, organizes, and converts information into a standardized format, which is then showed on the page.

## Usage

For data security and your convenience, we provide a complete and out-of-box solution. Read the "How to use" section in the [HuolalaTech/page-spy-web][page-spy-web]
to get more detail.

After the integration, open your project in browser, there should be a widget (round container with white background and include logo) on the bottom left. If not, check your config.

## The init parameters

All parameters are optional, here is a description of each property and its default value：

```ts
window.$pageSpy = new PageSpy(config?: InitConfig)

interface InitConfig {
  // The SDK automatically analyses and determines the address of
  // the Server (api) and the address of the debug side (clientOrigin)
  // from the "src" value, assuming you introduced it from https://example.com/page-spy/index.min.js,
  // so the SDK will set it up internally:
  //   - api: "example.com"
  //   - clientOrigin: "https://example.com"
  // If your service is deployed elsewhere, you can manually specify here to override.
  api: '';
  clientOrigin: '';

  // "project" is an aggregation of information that can be searched in the room list on the debug side.
  project: 'default';

  // "title" is a user-defined parameter that can be used to distinguish the current debugging client,
  // and the corresponding information is displayed under the "device id" in each debugging connection panel.
  title: '--';

  // Indicates whether the SDK will automatically render the "Circle with Logo on White Background"
  // control in the bottom left corner of the client when initiation is complete. If set to false,
  // you can call window.$pageSpy.render() to render it manually.
  autoRender: true;

  // Manually specify the scheme of the PageSpy service.
  // This works if the SDK can't correctly analyse the scheme, e.g. if PageSpy's browser plugin
  // is introduced into the SDK via chrome-extension://xxx/sdk/index.min.js, which will be
  // be parsed by the SDK as an invalid "chrome-extension://" and fallback to ["http://", "ws://"].
  //   - (Default) Pass the value undefined or null: the SDK will parse it automatically;
  //   - Pass boolean value:
  //     - true: the SDK will access the PageSpy service via ["https://", "wss://"].
  //     - false: the SDK will access the PageSpy service via ["http://", "wss://"]
  enableSSL: null;
}
```
