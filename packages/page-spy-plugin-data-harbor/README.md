# `@huolala-tech/page-spy-plugin-data-harbor`

> Used for caching data and downloading (only be available in browser environment).

## Definition

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

## Usage

### Options 1: Load with script

```html
<html>
  <head>
    <!-- 1. Load PageSpy -->
    <script src="https://<your-host>/page-spy/index.min.js"></script>
    <!-- 2. Load the plugin -->
    <script src="https://<your-host>/plugin/data-harbor/index.min.js"></script>
    <!-- 3. Register plugin && Init PageSpy -->
    <script>
      // Register plugin
      PageSpy.registerPlugin(new DataHarborPlugin(config));
      // Init PageSpy
      window.$pageSpy = new PageSpy();
    </script>
  </head>
</html>
```

### Option 2: Import with ESM

```ts
// In your entry file like "main.ts"
import PageSpy from '@huolala-tech/page-spy-browser';
import DataHarborPlugin from '@huolala-tech/page-spy-plugin-data-harbor';

// Register plugin
PageSpy.registerPlugin(new DataHarborPlugin(config));
// Init PageSpy
window.$pageSpy = new PageSpy();
```
