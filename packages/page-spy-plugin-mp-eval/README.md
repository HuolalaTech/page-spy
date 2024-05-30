[npm-image]: https://img.shields.io/npm/v/@huolala-tech/page-spy-plugin-mp-eval?logo=npm&label=version
[npm-url]: https://www.npmjs.com/package/@huolala-tech/page-spy-plugin-mp-eval
[minified-image]: https://img.shields.io/bundlephobia/min/@huolala-tech/page-spy-plugin-mp-eval
[minified-url]: https://unpkg.com/browse/@huolala-tech/page-spy-plugin-mp-eval/dist/iife/index.min.js

English | [中文](./README_ZH.md)

# `@huolala-tech/page-spy-plugin-mp-eval`

[![SDK version][npm-image]][npm-url]
[![SDK size][minified-image]][minified-url]

The `MPEvalPlugin` is used in mini program SDK of PageSpy, making it possible to run dynamic scripts in the mini program environment.

Available mini program SDKs include:

- [@huolala-tech/page-spy-wechat](https://www.npmjs.com/package/@huolala-tech/page-spy-wechat)
- [@huolala-tech/page-spy-alipay](https://www.npmjs.com/package/@huolala-tech/page-spy-alipay)
- [@huolala-tech/page-spy-uniapp](https://www.npmjs.com/package/@huolala-tech/page-spy-uniapp)
- [@huolala-tech/page-spy-taro](https://www.npmjs.com/package/@huolala-tech/page-spy-taro)

> [!CAUTION]
> When submitting the mini program for review, be sure to delete this plugin in the code, otherwise the review will fail.

## Usage

```ts
// In your entry file like "main.ts"
import PageSpy from '@huolala-tech/page-spy-wechat';
import MPEvalPlugin from '@huolala-tech/page-spy-plugin-mp-eval';

// Register plugin
PageSpy.registerPlugin(new MPEvalPlugin());
// Init PageSpy
const pageSpy = new PageSpy();
```
