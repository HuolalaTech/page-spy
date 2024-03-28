[npm-image]: https://img.shields.io/npm/v/@huolala-tech/page-spy-browser?logo=npm&label=version
[npm-url]: https://www.npmjs.com/package/@huolala-tech/page-spy-browser
[minified-image]: https://img.shields.io/bundlephobia/min/@huolala-tech/page-spy-browser
[minified-url]: https://unpkg.com/browse/@huolala-tech/page-spy-browser/dist/iife/index.min.js

English | [中文](./README_ZH.md)

# `@huolala-tech/page-spy-browser`

[![SDK version][npm-image]][npm-url]
[![SDK size][minified-image]][minified-url]

> The SDK used in Web environment.

## Usage

```html
<!-- 1. Load a <script> in your html -->
<script
  crossorigin="anonymous"
  src="https://<your-host>/page-spy/index.min.js"
></script>

<!-- 2. Init -->
<script>
  window.$pageSpy = new PageSpy(config?: InitConfig)
</script>
```

After the integration, open your project in browser, there should be a widget (round container with white background and include logo) on the bottom left. If not, check your config.

## `InitConfig` definition

For browser, all parameters are optional.

```ts
interface InitConfig {
  // The SDK automatically analyses and determines the address of
  // the Server (api) and the address of the debug side (clientOrigin)
  // from the "src" value, assuming you introduced it from https://example.com/page-spy/index.min.js,
  // so the SDK will set it up internally:
  //   - api: "example.com"
  //   - clientOrigin: "https://example.com"
  // If your service is deployed elsewhere, you can manually specify here to override.
  api?: string;
  clientOrigin?: string;

  // "project" is an aggregation of information that can be searched in the room list on the debug side.
  // default: 'default'
  project?: string;

  // "title" is a user-defined parameter that can be used to distinguish the current debugging client,
  // and the corresponding information is displayed under the "device id" in each debugging connection panel.
  // default: '--'
  title?: string;

  // Indicates whether the SDK will automatically render the "Circle with Logo on White Background"
  // control in the bottom left corner of the client when initiation is complete. If set to false,
  // you can call window.$pageSpy.render() to render it manually.
  // default: true
  autoRender?: boolean;

  // Manually specify the scheme of the PageSpy service.
  // This works if the SDK can't correctly analyse the scheme, e.g. if PageSpy's browser plugin
  // is introduced into the SDK via chrome-extension://xxx/sdk/index.min.js, which will be
  // be parsed by the SDK as an invalid "chrome-extension://" and fallback to ["http://", "ws://"].
  //   - (Default) Pass the value undefined or null: the SDK will parse it automatically;
  //   - Pass boolean value:
  //     - true: the SDK will access the PageSpy service via ["https://", "wss://"].
  //     - false: the SDK will access the PageSpy service via ["http://", "wss://"]
  enableSSL?: boolean | null;

  // All internal plugins are carried with PageSpy by default out of the box.
  // You can disable some plugins as needed.
  disabledPlugins?: (InternalPlugins | string)[];

  // After adding support for offline replay in PageSpy@1.7.4, the client-integrated SDK can work without
  // establishing a connection with the debugger.
  // Default value is false, when users set it to other values will enters "offline mode", where PageSpy
  // will not create rooms or establish WebSocket connections.
  offline?: boolean;

  // Customize logo source url.
  logo?: string;

  // Customize logo style.
  logoStyle?: Object;
}

type InternalPlugins =
  | 'ConsolePlugin'
  | 'ErrorPlugin'
  | 'NetworkPlugin'
  | 'StoragePlugin'
  | 'DatabasePlugin'
  | 'PagePlugin'
  | 'SystemPlugin';
```
