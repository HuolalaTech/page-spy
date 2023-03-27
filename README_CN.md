[page-spy-web]: https://github.com/HuolalaTech/page-spy-web.git 'page-spy-web'

[English](./README.md) | 中文

<p align="center">
  <img src="./logo.svg" height="120" />
</p>

<h1 align="center">PageSpy</h1>

> 一款远程调试网页的工具。

## 简介

这个仓库和 [Huolala-Tech/page-spy-web][page-spy-web] 相互配合，具体而言 `page-spy` 负责收集页面信息；`page-spy-web` 消费收集的信息，对数据进行过滤和整理，并将其转换成一种标准格式，最后在页面上呈现。

## 使用

1. 在项目中添加 `<script>` 加载:

```html
<script src="https://unpkg.com/@huolala-tech/page-spy@latest/dist/index.min.js"></script>
```

2. 然后配置 `PageSpy` 并初始化：

```html
<script>
  new PageSpy({
    api: '<api-base-host>', // 例如, "example.com"
    clientOrigin: '<debugger-ui-client-origin>', // 例如, "https://example.com"
  });
</script>
```

3. 大功告成！在浏览器中打开你的项目，页面左下角应该有一个控件（白底圆形的容器，包含 logo）。如果没有，请检查你的配置。

> 请注意，`page-spy` 可以从 `document.currentScript.src` 自动检测配置信息。例如，如果 `page-spy` 是从 "https://xxx.yyy/page-spy/dist/index.min.js" 加载的并使用 `new PageSpy() 进行初始化`，那么 api 值将为 `xxx.yyy`，clientOrigin 值将为 `https://xxx.yyy`。
