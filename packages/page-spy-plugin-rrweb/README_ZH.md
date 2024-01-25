[npm-image]: https://img.shields.io/npm/v/@huolala-tech/page-spy-plugin-rrweb?logo=npm&label=version
[npm-url]: https://www.npmjs.com/package/@huolala-tech/page-spy-plugin-rrweb
[minified-image]: https://img.shields.io/bundlephobia/min/@huolala-tech/page-spy-plugin-rrweb
[minified-url]: https://unpkg.com/browse/@huolala-tech/page-spy-plugin-rrweb/dist/iife/index.min.js

[English](./README.md) | 中文

# `@huolala-tech/page-spy-plugin-rrweb`

[![SDK version][npm-image]][npm-url]
[![SDK size][minified-image]][minified-url]

> `RRWebPlugin` 使用 `rrweb` 记录 DOM 更新（该插件可用于浏览器环境）。

## 类型定义

```ts
import { PageSpyPlugin } from '@huolala-tech/page-spy-types';
import type { recordOptions } from 'rrweb/typings/types';
import type { eventWithTime } from '@rrweb/types';

interface Options extends recordOptions<eventWithTime> {}

declare class RRWebPlugin implements PageSpyPlugin {
  constructor(options?: Options);
}

export default RRWebPlugin;
```

## 使用

### 加载插件

- 方式 1：使用 `<script>` 加载

  ```html
  <html>
    <head>
      <!-- 1. 加载 PageSpy -->
      <script src="https://<your-host>/page-spy/index.min.js"></script>
      <!-- 2. 加载插件 -->
      <script src="https://<your-host>/plugin/rrweb/index.min.js"></script>
      <!-- 3. 注册插件 && 初始化 PageSpy -->
      <script>
        // 注册插件
        PageSpy.registerPlugin(new RRWebPlugin(options));
        // 实例化 PageSpy
        window.$pageSpy = new PageSpy();
      </script>
    </head>
  </html>
  ```

- 方式 2：使用 `import` 引入

  ```ts
  // 在你的入口文件中（如 "main.ts"）导入
  import PageSpy from '@huolala-tech/page-spy-browser';
  import RRWebPlugin from '@huolala-tech/page-spy-plugin-rrweb';

  // 注册插件
  PageSpy.registerPlugin(new RRWebPlugin(options));
  // 实例化 PageSpy
  window.$pageSpy = new PageSpy();
  ```

### 回放

通常情况下，`rrweb` 产生的数据体积会比较大（交互越多、网页结构越复杂会导致数据量越大）。当开发人员进行调试时，实时传输可能对网络开销造成负担，并且页面交互并不总是关键信息。考虑到这些因素，该插件只派发 'public-data' 事件（[什么是 `"public-data"` 事件？](../../docs//plugin_zh.md#行为约定)）供统计插件收集。
