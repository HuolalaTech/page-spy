[npm-image]: https://img.shields.io/npm/v/@huolala-tech/page-spy-taro?logo=npm&label=version
[npm-url]: https://www.npmjs.com/package/@huolala-tech/page-spy-taro
[minified-image]: https://img.shields.io/bundlephobia/min/@huolala-tech/page-spy-taro
[minified-url]: https://unpkg.com/browse/@huolala-tech/page-spy-taro/dist/esm/index.min.js

[English](./README.md) | 中文

# `@huolala-tech/page-spy-taro`

[![SDK version][npm-image]][npm-url]
[![SDK size][minified-image]][minified-url]

用于调试 Taro 小程序的 [PageSpy](https://www.pagespy.org) 客户端 SDK.

## 使用

```ts
import PageSpy from '@huolala-tech/page-spy-taro';

const pageSpy = new PageSpy({
  api: 'example.com',
});
```

详细的 API 定义请参考官方文档 [PageSpy API](https://www.pagespy.org/#/docs/api)。
