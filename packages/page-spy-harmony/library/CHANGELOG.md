# CHANGELOG

## [v2.0.0] 2024-06-06

- 🐛 修复 `$pageSpy.abort()` 误删除事件；
- 🆕 从 `system` 消息类型拆分出 `client-info` 消息类型；

## [v2.0.0-beta.1] 2024-05-22

- 🐛 修复 `ConsolePlugin` 中打印路由信息依赖 context 导致 crash 的问题；
- 🐛 修复依赖 `@ohos/axios` 导致 crash 的问题；
- 🆕 更新说明；

## [v2.0.0-beta.0] 2024-05-21

- 🆕 适配 API 11；
- 🆕 添加 `StoragePlugin` 用于查看 `AppStorage` 信息；
- 🆕 优化 socket 逻辑；

## [v1.0.1] 2024-04-16

- 🐛 实例化出错时在 IDE 控制台打印错误信息；

## [v1.0.0] 2024-04-15

- 🆕 添加 `Console / Network / System / Error` 插件；
