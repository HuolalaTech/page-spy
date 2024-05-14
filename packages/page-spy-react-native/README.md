[npm-image]: https://img.shields.io/npm/v/@huolala-tech/page-spy-react-native?logo=npm&label=version
[npm-url]: https://www.npmjs.com/package/@huolala-tech/page-spy-react-native
[minified-image]: https://img.shields.io/bundlephobia/min/@huolala-tech/page-spy-react-native
[minified-url]: https://unpkg.com/browse/@huolala-tech/page-spy-react-native/dist/esm/index.min.js

English | [中文](./README_ZH.md)

# `@huolala-tech/page-spy-react-native`

[![SDK version][npm-image]][npm-url]
[![SDK size][minified-image]][minified-url]

> The SDK used in React Native apps.

> [!CAUTION]
> When submitting the mini program for review, be sure to delete the SDK in the code, otherwise the review will fail.

## Usage

```ts
import PageSpy from '@huolala-tech/page-spy-react-native'

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

  // All internal plugins are carried with PageSpy by default out of the box.
  // You can disable some plugins as needed.
  disabledPlugins?: (InternalPlugins | string)[];
}

type InternalPlugins =
  | 'ConsolePlugin'
  | 'ErrorPlugin'
  | 'NetworkPlugin'
  | 'SystemPlugin';
```

## Other topics

### https

iOS and Android only support HTTPS by default. If the page-spy service you deploy doesn't have HTTPS enabled, it will result in being unable to connect to the page-spy service.

And here's the link: https://reactnative.dev/docs/network

### storage

This package does not include a default storage plugin, since the latest React Native removed the official storage APIs.

If you use the official recommended storage library `@react-native-async-storage/async-storage`, we provide an independent plugin for you: [`@huolala-tech/page-spy-plugin-rn-async-storage`](https://www.npmjs.com/package/@huolala-tech/page-spy-plugin-rn-async-storage)
