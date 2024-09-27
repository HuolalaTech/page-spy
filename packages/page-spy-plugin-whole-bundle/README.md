# `@huolala-tech/page-spy-plugin-whole-bundle`

![Screenshot](./.github/screenshots/image.png)

插件打包了三个依赖，实现 _一个脚本开启离线模式的 PageSpy、录制操作轨迹、支持导出离线日志_ 的功能:

- [@huolala-tech/page-spy-browser](../page-spy-browser/);
- [@huolala-tech/page-spy-plugin-data-harbor](../page-spy-plugin-data-harbor/);
- [@huolala-tech/page-spy-plugin-rrweb](../page-spy-plugin-rrweb/);

## 使用

### 通过 `<script>` 引入

`WholeBundle` 插件资源文件会自动放置在你部署 PageSpy 的服务下、方便直接引用，路径是 `https://<your-pagespy-host>/plugin/whole-bundle/index.min.js`。

举个例子，如果 PageSpy 的访问域名是 `https://example.com`，那么你可以在项目中通过下面的方式引入：

```html
<head>
  ... ...
  <script
    src="https://example.com/plugin/whole-bundle/index.min.js"
    crossorigin="anonymous"
  ></script>
</head>
```

按照以上方式引入后，`WholeBundle` 会自动完成初始化。

如果你想自定义 logo / 标题 / 声明等内容，可以这样做：

```html
<head>
  ... ...
  <!-- 在路径上加 #manual 表明你要手动初始化，之后可以通过 window.WholeBundle 全局变量引用 -->
  <script
    src="https://example.com/plugin/whole-bundle/index.min.js#manual"
    crossorigin="anonymous"
  ></script>
  <script>
    const $wholeBundle = new WholeBundle({
      /**
       * Used for float button text and modal title
       */
      title?: string;
      /**
       * - Online source: 'https://example.com/xxx.jpg'
       * - Data url: 'data:image/png;base64,xxxx...'
       * - Relative source: '../xxx.jpg'
       * - Plain SVG content: '<svg>xxx</svg>'
       */
      logo?: string;
      statement?: string;
    })
  </script>
</head>
```

### ESM 引入

- 安装

```bash
yarn add @huolala-tech/page-spy-plugin-whole-bundle

# OR

npm install @huolala-tech/page-spy-plugin-whole-bundle
```

- 使用

```ts
import WholeBundle from '@huolala-tech/page-spy-plugin-whole-bundle';
import '@huolala-tech/page-spy-plugin-whole-bundle/dist/index.css';

const $wholeBundle = new WholeBundle({
  /**
   * Used for float button text and modal title
   */
  title?: string;
  /**
   * Online source: 'https://example.com/xxx.jpg'
   * Data url: 'data:image/png;base64,xxxx...'
   * Relative source: '../xxx.jpg'
   * Plain SVG content: '<svg>xxx</svg>'
   */
  logo?: string;
  statement?: string;
})
```
