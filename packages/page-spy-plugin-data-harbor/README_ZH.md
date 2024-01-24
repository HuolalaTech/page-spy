# `@huolala-tech/page-spy-plugin-data-harbor`

> 用于缓存、下载数据（当前只支持在浏览器环境中使用）。

## 类型定义

```ts
type DataType = 'console' | 'network' | 'rrweb-event';
type SaveAs = 'indexedDB' | 'memory';

interface DataHarborConfig {
  maximum?: number;
  saveAs?: SaveAs;
  caredData?: Record<DataType, boolean>;
}

declare class DataHarborPlugin {
  constructor(config?: DataHarborConfig);
}

export default DataHarborPlugin;
```

## 使用

### 方式 1：使用 `<script>` 加载

```html
<html>
  <head>
    <!-- 1. 加载 PageSpy -->
    <script src="https://<your-host>/page-spy/index.min.js"></script>
    <!-- 2. 加载插件 -->
    <script src="https://<your-host>/plugin/data-harbor/index.min.js"></script>
    <!-- 3. 注册插件 && 实例化 PageSpy -->
    <script>
      // 注册插件
      PageSpy.registerPlugin(new DataHarborPlugin(config));
      // 实例化
      window.$pageSpy = new PageSpy();
    </script>
  </head>
</html>
```

### 方式 2：使用 `import` 导入

```ts
// 在你的入口文件中（如 "main.ts"）导入
import PageSpy from '@huolala-tech/page-spy-browser';
import DataHarborPlugin from '@huolala-tech/page-spy-plugin-data-harbor';

// 注册插件
PageSpy.registerPlugin(new DataHarborPlugin(config));
// 实例化 PageSpy
window.$pageSpy = new PageSpy();
```
