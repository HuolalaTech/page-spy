# Changelog

All notable changes to this project will be documented in this file. See [standard-version](https://github.com/conventional-changelog/standard-version) for commit guidelines.

### [1.4.2](https://github.com/HuolalaTech/page-spy/compare/v1.4.1...v1.4.2) (2023-11-15)

### [1.3.1](https://github.com/HuolalaTech/page-spy/compare/v1.2.5...v1.3.1) (2023-10-16)

## [1.3.0](https://github.com/HuolalaTech/page-spy/compare/v1.2.5...v1.3.0) (2023-08-15)

### [1.2.5](https://github.com/HuolalaTech/page-spy/compare/v1.2.4...v1.2.5) (2023-08-08)

### Features

- add title config ([36b1b54](https://github.com/HuolalaTech/page-spy/commit/36b1b5402aa89fac9fdc516f5a485c619a81d15d))

### [1.2.4](https://github.com/HuolalaTech/page-spy/compare/v1.2.3...v1.2.4) (2023-07-24)

### Bug Fixes

- use ArrayBuffer.isView instead of constructor ([c6b61da](https://github.com/HuolalaTech/page-spy/commit/c6b61daf7df7485ebaaabc215d587a45efa86cfd))

### [1.2.3](https://github.com/HuolalaTech/page-spy/compare/v1.2.2...v1.2.3) (2023-07-20)

### Features

- avoid some edge cases ([84a44d5](https://github.com/HuolalaTech/page-spy/commit/84a44d5e58859055ea85021968777e49de9cac05))

### [1.2.2](https://github.com/HuolalaTech/page-spy/compare/v1.2.1...v1.2.2) (2023-07-04)

### Features

- assign onerror directly if not configurable ([7799aaf](https://github.com/HuolalaTech/page-spy/commit/7799aaf9c03126d7018d4ce875a216f7571b3a45))
- plugins 'onCreate' can only be init once ([06d31ba](https://github.com/HuolalaTech/page-spy/commit/06d31bacd1e32908c98e2de3757e3e7f0433d421))
- singleton mode PageSpy ([ddcd2cd](https://github.com/HuolalaTech/page-spy/commit/ddcd2cdce20590e7526119519bf7c827ce14ca28))
- update log info & fix typo ([a5490df](https://github.com/HuolalaTech/page-spy/commit/a5490df585e2c9b013e1f7b3fb87143ba4d5df59))
- update the log info ([eef934c](https://github.com/HuolalaTech/page-spy/commit/eef934c3459b8e6f66ee6b8ce450121d4d66ebcc))

### Bug Fixes

- don't handle window.onerror ([ae47966](https://github.com/HuolalaTech/page-spy/commit/ae479662eb5436156ecaf6a0a3f7c63f7a2245b6))
- prevent window.onerror from being overriden ([c936ca7](https://github.com/HuolalaTech/page-spy/commit/c936ca75e2176b2e7c6df59d5daf1cbbdb68977c))

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
