[npm-image]: https://img.shields.io/npm/v/@huolala-tech/page-spy-wechat?logo=npm&label=version
[npm-url]: https://www.npmjs.com/package/@huolala-tech/page-spy-wechat
[minified-image]: https://img.shields.io/bundlephobia/min/@huolala-tech/page-spy-wechat
[minified-url]: https://unpkg.com/browse/@huolala-tech/page-spy-wechat/dist/iife/index.min.js

English | [中文](./README_ZH.md)

# `@huolala-tech/page-spy-wechat`

[![SDK version][npm-image]][npm-url]
[![SDK size][minified-image]][minified-url]

> The SDK used in wechat miniprogram environment.

> [!CAUTION]
> When submitting the mini program for review, be sure to delete the SDK in the code, otherwise the review will fail.

## Usage

```ts
import PageSpy from '@huolala-tech/page-spy-wechat'

const pageSpy = new PageSpy(config?: InitConfig)
```

## `InitConfig` definition

Except for the `api` parameter is required, all others parameters are optional:

```ts
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

  // Disable pagespy on release environment.
  // - true (Default): only allow pagespy init on develop and trail environment.
  // - false: allow using in release environment
  disabledOnProd?: boolean | null;

  // All internal plugins are carried with PageSpy by default out of the box.
  // You can disable some plugins as needed.
  disabledPlugins?: (InternalPlugins | string)[];
}

type InternalPlugins =
  | 'ConsolePlugin'
  | 'ErrorPlugin'
  | 'NetworkPlugin'
  | 'StoragePlugin'
  | 'SystemPlugin';
```

For more details of mini-program usage, please refer to [Mini-Program Usage](https://github.com/HuolalaTech/page-spy/wiki/%E5%B0%8F%E7%A8%8B%E5%BA%8F%E4%BD%BF%E7%94%A8%E8%AF%B4%E6%98%8E)
