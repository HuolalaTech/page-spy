[npm-image]: https://img.shields.io/npm/v/@huolala-tech/page-spy-plugin-rrweb?logo=npm&label=version
[npm-url]: https://www.npmjs.com/package/@huolala-tech/page-spy-plugin-rrweb
[minified-image]: https://img.shields.io/bundlephobia/min/@huolala-tech/page-spy-plugin-rrweb
[minified-url]: https://unpkg.com/browse/@huolala-tech/page-spy-plugin-rrweb/dist/iife/index.min.js
[rrweb-repo]: https://github.com/rrweb-io/rrweb
[rrweb-record-options]: https://github.com/rrweb-io/rrweb/blob/master/guide.md#options

English | [中文](./README_ZH.md)

# `@huolala-tech/page-spy-plugin-rrweb`

[![SDK version][npm-image]][npm-url]
[![SDK size][minified-image]][minified-url]

> Use `rrweb` under the hood, record the DOM mutation within PageSpy, only be available in browser environment.

## Definition

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

`RRWebPlugin` use [`rrweb-record`][rrweb-repo] under the hood, the instantiate options reference [record options][rrweb-record-options].

## Usage

### Load plugin

- Options 1: Load with script

  ```html
  <html>
    <head>
      <!-- 1. Load PageSpy -->
      <script src="https://<your-host>/page-spy/index.min.js"></script>
      <!-- 2. Load the DataHarborPlugin plugin -->
      <script src="https://<your-host>/plugin/data-harbor/index.min.js"></script>
      <!-- 3. Load the RRWebPlugin plugin -->
      <script src="https://<your-host>/plugin/rrweb/index.min.js"></script>
      <!-- 4. Register plugin && Init PageSpy -->
      <script>
        // 1. Register DataHarborPlugin plugin
        PageSpy.registerPlugin(new DataHarborPlugin(config));
        // 2. Register RRWebPlugin plugin
        PageSpy.registerPlugin(new RRWebPlugin(options));
        // 3. Init PageSpy
        window.$pageSpy = new PageSpy();
      </script>
    </head>
  </html>
  ```

- Option 2: Import within ESM

  ```ts
  // In your entry file like "main.ts"
  import PageSpy from '@huolala-tech/page-spy-browser';
  import RRWebPlugin from '@huolala-tech/page-spy-plugin-rrweb';

  // Register plugin
  PageSpy.registerPlugin(new RRWebPlugin(options));
  // Init PageSpy
  window.$pageSpy = new PageSpy();
  ```

### Replay

The data from 'rrweb-event' is typically larger (more interactions and complex webpage structures result in larger data). When developers debug, real-time transmission can impose a burden on network overhead, and page interactions are not always critical information. Considering these factors, this plugin only dispatch the 'public-data' event ([what's the `public-data` event?](../../docs/plugin.md#behavioral-conventions)) for statistical plugins to collect.
