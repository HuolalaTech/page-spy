[npm-image]: https://img.shields.io/npm/v/@huolala-tech/page-spy-plugin-rn-async-storage?logo=npm&label=version
[npm-url]: https://www.npmjs.com/package/@huolala-tech/page-spy-plugin-rn-async-storage
[minified-image]: https://img.shields.io/bundlephobia/min/@huolala-tech/page-spy-plugin-rn-async-storage
[minified-url]: https://unpkg.com/browse/@huolala-tech/page-spy-plugin-rn-async-storage/dist/iife/index.min.js

[English](./README.md) | 中文

# `@huolala-tech/page-spy-plugin-rn-async-storage`

[![SDK version][npm-image]][npm-url]
[![SDK size][minified-image]][minified-url]

该插件用于在 React Native 环境中读取 AsyncStorage 中的数据，仅可用于 PageSpy ReactNative SDK: `@huolala-tech/page-spy-react-native`，且需配合 `@react-native-async-storage/async-storage` 使用。

## 使用

```ts
// 在你的入口文件中（如 "main.ts"）导入
import PageSpy from '@huolala-tech/page-spy-react-native';
import AsyncStoragePlugin from '@huolala-tech/page-spy-plugin-rn-async-storage';

// 注册插件
PageSpy.registerPlugin(new AsyncStoragePlugin());
// 实例化 PageSpy
const pageSpy = new PageSpy();
```

之后在 PageSpy 调试端进入房间后，在 存储 -> Async Storage 中即可看到 AsyncStorage 中的数据。
