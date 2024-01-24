# `@huolala-tech/page-spy-plugin-rrweb`

> 配合 PageSpy 录制 DOM 更新（仅适用于浏览器环境）。

## 类型定义

```ts
import { PageSpyPlugin } from '@huolala-tech/page-spy-types';
import type { recordOptions } from 'rrweb/typings/types';
import type { eventWithTime } from '@rrweb/types';

interface Options extends recordOptions<eventWithTime> {
  allowOnline?: true;
}

declare class RRWebPlugin implements PageSpyPlugin {
  constructor(options?: Options);
}

export default RRWebPlugin;
```

## 使用

### 方式 1：使用 `<script>` 加载

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

### 方式 2：使用 `import` 引入

```ts
// 在你的入口文件中（如 "main.ts"）导入
import PageSpy from '@huolala-tech/page-spy-browser';
import RRWebPlugin from '@huolala-tech/page-spy-plugin-rrweb';

// 注册插件
PageSpy.registerPlugin(new RRWebPlugin(options));
// 实例化 PageSpy
window.$pageSpy = new PageSpy();
```
