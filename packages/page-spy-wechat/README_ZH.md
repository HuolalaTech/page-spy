[npm-image]: https://img.shields.io/npm/v/@huolala-tech/page-spy-wechat?logo=npm&label=version
[npm-url]: https://www.npmjs.com/package/@huolala-tech/page-spy-wechat
[minified-image]: https://img.shields.io/bundlephobia/min/@huolala-tech/page-spy-wechat
[minified-url]: https://unpkg.com/browse/@huolala-tech/page-spy-wechat/dist/iife/index.min.js

[English](./README.md) | 中文

# `@huolala-tech/page-spy-wechat`

[![SDK version][npm-image]][npm-url]
[![SDK size][minified-image]][minified-url]

用于调试微信小程序的 [PageSpy](https://www.pagespy.org) 客户端 SDK.

## 使用

在原生微信小程序中使用 npm 包，请遵循 [npm 支持](https://developers.weixin.qq.com/miniprogram/dev/devtools/npm.html)。

```ts
import PageSpy from '@huolala-tech/page-spy-wechat';

const pageSpy = new PageSpy({
  api: 'example.com',
});
```

详细的 API 定义请参考官方文档 [PageSpy API](https://www.pagespy.org/#/docs/api)。

## 其他 SDK

如果你使用 UniAPP 或者 Taro，推荐使用相应的 SDK：

- [@huolala-tech/page-spy-uniapp](https://www.npmjs.com/package/@huolala-tech/page-spy-uniapp)
- [@huolala-tech/page-spy-taro](https://www.npmjs.com/package/@huolala-tech/page-spy-taro)
