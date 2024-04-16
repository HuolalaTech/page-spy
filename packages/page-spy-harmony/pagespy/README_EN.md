[page-spy-web]: https://github.com/HuolalaTech/page-spy-web.git 'page-spy-web'
[sdk-version]: https://harmony.blucas.me/badge/version/@huolala/page-spy-harmony
[sdk-size]: https://harmony.blucas.me/badge/size/@huolala/page-spy-harmony

[中文](./README.md) | English

# `@huolala/page-spy-harmony`

![SDK version][sdk-version]

<div align="center">
    <img src="./logo.svg" height="100" />

  <h1>PageSpy for OpenHarmony</h1>
  <p>PageSpy is an open-source platform for debugging Web, Mini Programs, and HarmonyOS applications.</p>

<a href="https://www.producthunt.com/posts/pagespy?utm_source=badge-featured&utm_medium=badge&utm_souce=badge-pagespy" target="_blank"><img src="https://api.producthunt.com/widgets/embed-image/v1/featured.svg?post_id=429852&theme=light" alt="PageSpy - Remote debugging as seamless as local debugging | Product Hunt" height="36" /></a> <a href="https://news.ycombinator.com/item?id=38679798" target="_blank"><img src="https://hackernews-badge.vercel.app/api?id=38679798" alt="PageSpy - Remote debugging as seamless as local debugging | Hacker News" height="36" /></a>

</div>

## Introduction

`@huolala/page-spy-harmony` is an SDK implementation on the HarmonyOS platform by Huolala's open-source project [PageSpy][page-spy-web]. PageSpy is used for local and remote debugging of user devices, currently supporting debugging for WEB, Mini Programs, and HarmonyOS platforms. For more detailed information, please refer to the [main repository][page-spy-web].

## Version Compatibility

- `1.x`: For OpenHarmony API 9 versions;
- `2.x`: For OpenHarmony API 11 versions;

## Getting Started

> Before importing the SDK, please deploy the PageSpy service. For deployment methods, please refer to the [PageSpy Deployment Guide](https://github.com/HuolalaTech/page-spy-web/?tab=readme-ov-file#how-to-use).

- Step 1: Install in your HAP directory;

```bash
ohpm install @huolala/page-spy-harmony
```

- Step 2: Import the SDK and instantiate it in your project;

```ts
// Import and instantiate the SDK at an appropriate location in your HAP
// This example demonstrates operations in the src/main/ets/Entry/EntryAbility.ts file

import { PageSpy } from '@huolala/page-spy-harmony';

export default class EntryAbility extends UIAbility {
  onWindowStageCreate(windowStage: window.WindowStage) {
    new PageSpy({
      // PageSpy service domain
      // If the service is deployed at https://example.com, fill in "example.com"
      api: '<your-pagespy-server-host>',

      // Whether the PageSpy deployed service uses HTTPS
      enableSSL: true,

      // The class or instance of `@ohos/axios`, used for inspect network info
      axios: axiosInstance,
    });
  }
}
```

That's all you need to know to integrate PageSpy! Afterward, please refresh the APP, then open your browser and navigate to the PageSpy service to start debugging.
