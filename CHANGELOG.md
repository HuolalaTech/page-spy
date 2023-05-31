# Changelog

All notable changes to this project will be documented in this file. See [standard-version](https://github.com/conventional-changelog/standard-version) for commit guidelines.

## [1.2.0](https://github.com/HuolalaTech/page-spy/compare/v1.1.0...v1.2.0) (2023-05-31)

### ⚠ BREAKING CHANGES

- The headers and getData structure have been changed to [string, string][]. The use of postData is now deprecated. Please use requestPayload instead, with a structure of [string, string][] | string.

### Features

- correct the delete last one cookie value and format the cookie ([#4](https://github.com/HuolalaTech/page-spy/issues/4)) ([059b777](https://github.com/HuolalaTech/page-spy/commit/059b7772b94f3a73070322032759f0016008ffce))
- reorganize the network plugin structure ([#3](https://github.com/HuolalaTech/page-spy/issues/3)) ([aa199fb](https://github.com/HuolalaTech/page-spy/commit/aa199fba5cd7d547dec3e1d24875bbda833f9812))

### Bug Fixes

- 明确设置 touchstart/touchmove 事件的 passive 配置项 ([#2](https://github.com/HuolalaTech/page-spy/issues/2)) ([2e26cd1](https://github.com/HuolalaTech/page-spy/commit/2e26cd17980abc66be247749ee8476f68356484f))

## [1.1.0](https://github.com/HuolalaTech/page-spy/compare/v1.1.0-beta.1...v1.1.0) (2023-05-24)

### Bug Fixes

- resolve protocol ([#1](https://github.com/HuolalaTech/page-spy/issues/1)) ([4fbc609](https://github.com/HuolalaTech/page-spy/commit/4fbc609769936058807f25dfab4666d78297abfc)), closes [#3](https://github.com/HuolalaTech/page-spy/issues/3)

### [1.0.5](https://github.com/HuolalaTech/page-spy/compare/v1.0.4...v1.0.5) (2023-05-11)

### Features

- show 'project' field and fix viewport size ([581b65b](https://github.com/HuolalaTech/page-spy/commit/581b65be296dc2d7501b17b5eeff2775a2311174))

### [1.0.4](https://github.com/HuolalaTech/page-spy/compare/v1.0.3...v1.0.4) (2023-04-27)

### Features

- add location info on PagePlugin ([f2fbd58](https://github.com/HuolalaTech/page-spy/commit/f2fbd5815a9c3b5f4b6ce3904e8e8bbd9257f06b))

### [1.0.3](https://github.com/HuolalaTech/page-spy/compare/v1.0.2...v1.0.3) (2023-04-24)

### Bug Fixes

- 🐛 support data which no prototype ([5835960](https://github.com/HuolalaTech/page-spy/commit/58359606475db153a2ef9a9873ed6ec22be99e96))

### [1.0.2](https://github.com/HuolalaTech/page-spy/compare/v1.0.1...v1.0.2) (2023-04-20)

### 1.0.1 (2023-04-13)

### Bug Fixes

- 🐛 add `reconnectable` to avoid creating infinitly when err ([d9fa83f](https://github.com/HuolalaTech/page-spy/commit/d9fa83f75af74a456fcf2e0c2d94681ce3361277))
- 🐛 clear room info session when reconnect faield ([6c7dcef](https://github.com/HuolalaTech/page-spy/commit/6c7dcef902114658430bdd4eca46581b70524a10))
- 🐛 SocketStore add `debugger-online` event to flush cache ([e07428e](https://github.com/HuolalaTech/page-spy/commit/e07428e3589ea2d65f575edb1653f1df664a9988))
- storage plugin ([1b9eb23](https://github.com/HuolalaTech/page-spy/commit/1b9eb23b17a80fbbeb53478642cf9416b81ca6f5))
