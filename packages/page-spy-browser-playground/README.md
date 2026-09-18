# PageSpy Browser Playground

长期保留的 Browser SDK 手工验证项目。它直接使用本仓库构建出的
`packages/page-spy-browser/dist/esm/index.min.js`，不需要创建临时项目或
`yarn link`。

```bash
yarn workspace @huolala-tech/page-spy-browser-playground dev
```

该命令会先构建 Browser SDK，再在 `http://localhost:4173` 启动 playground。
修改 SDK 源码后，重启该命令即可加载最新构建产物。

页面默认连接 `https://pagespy.jikejishu.com`，可修改服务端地址；`api` 和
`clientOrigin` 会自动重新计算。场景面板覆盖控制台、HTTP、Fetch SSE、数据接口、
浏览器缓存、IndexedDB、异常和 DOM 变更。
