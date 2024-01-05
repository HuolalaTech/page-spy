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
  <p>PageSpy is a developer platform for debugging web page.</p>

[![Coverage Status][coveralls-image]][coveralls-url] [![NPM Package][npm-image]][npm-url] [![Minified size][minified-image]][minified-url]

<a href="https://www.producthunt.com/posts/pagespy?utm_source=badge-featured&utm_medium=badge&utm_souce=badge-pagespy" target="_blank"><img src="https://api.producthunt.com/widgets/embed-image/v1/featured.svg?post_id=429852&theme=light" alt="PageSpy - Remote&#0032;debugging&#0032;as&#0032;seamless&#0032;as&#0032;local&#0032;debugging&#0046; | Product Hunt" height="36" /></a> <a href="https://news.ycombinator.com/item?id=38679798" target="_blank"><img src="https://hackernews-badge.vercel.app/api?id=38679798" alt="PageSpy - Remote&#0032;debugging&#0032;as&#0032;seamless&#0032;as&#0032;local&#0032;debugging&#0046; | Hacker News" height="36" /></a>

English | [中文](./README_ZH.md)

</div>

## What's this

This repo is the SDK which be used in [HuolalaTech/page-spy-web][page-spy-web], where SDK collects information and `page-spy-web` consumes and filters, organizes, and converts information into a standardized format, which is then showed on the page.

## Usage

For data security and your convenience, we provide a complete and out-of-box solution. Read the "How to use" section in the [HuolalaTech/page-spy-web][page-spy-web]
to get more detail.

After the integration, open your project in browser, there should be a widget (round container with white background and include logo) on the bottom left. If not, check your config.

## The init parameters

### Web

For browser, all parameters are optional, here is a description of each property and its default value：

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
  api?: string;
  clientOrigin?: string;

  // "project" is an aggregation of information that can be searched in the room list on the debug side.
  // default: 'default'
  project?: string;

  // "title" is a user-defined parameter that can be used to distinguish the current debugging client,
  // and the corresponding information is displayed under the "device id" in each debugging connection panel.
  // default: '--'
  title?: string;

  // Indicates whether the SDK will automatically render the "Circle with Logo on White Background"
  // control in the bottom left corner of the client when initiation is complete. If set to false,
  // you can call window.$pageSpy.render() to render it manually.
  // default: true
  autoRender?: boolean;

  // Manually specify the scheme of the PageSpy service.
  // This works if the SDK can't correctly analyse the scheme, e.g. if PageSpy's browser plugin
  // is introduced into the SDK via chrome-extension://xxx/sdk/index.min.js, which will be
  // be parsed by the SDK as an invalid "chrome-extension://" and fallback to ["http://", "ws://"].
  //   - (Default) Pass the value undefined or null: the SDK will parse it automatically;
  //   - Pass boolean value:
  //     - true: the SDK will access the PageSpy service via ["https://", "wss://"].
  //     - false: the SDK will access the PageSpy service via ["http://", "wss://"]
  enableSSL?: boolean | null;
}
```

### Mini Program

Except for the `api` parameter, all parameters are optional, here is a description of each property and its default value：

```ts
const pageSpy = new PageSpy(config?: InitConfig)

interface InitConfig {
  // Server domain, must be provided。
  // Example："example.com"
  api: string;

  // "project" is an aggregation of information that can be searched in the room list on the debug side.
  // default: 'default'
  project?: string;

  // "title" is a user-defined parameter that can be used to distinguish the current debugging client,
  // and the corresponding information is displayed under the "device id" in each debugging connection panel.
  // default: '--'
  title?: string;

  // Manually specify the scheme of the PageSpy service.
  // Note that except for development environment, mini-program requires the scheme to be set to "https", so:
  //  - By default, pass the value undefined or null, the SDK will parse it to TRUE;
  //  - true: the SDK will access the PageSpy service via ["https://", "wss://"];
  //  - false: the SDK will access the PageSpy service via ["http://", "wss://"].
  enableSSL?: boolean | null;
}

```

For more details of mini-program usage, please refer to [Mini-Program Usage](https://github.com/HuolalaTech/page-spy/wiki/%E5%B0%8F%E7%A8%8B%E5%BA%8F%E4%BD%BF%E7%94%A8%E8%AF%B4%E6%98%8E)
