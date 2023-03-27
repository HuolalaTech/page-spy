[page-spy-web]: https://github.com/HuolalaTech/page-spy-web.git 'page-spy-web'

English | [中文](./README_CN.md)

<p align="center">
  <img src="./logo.svg" height="120" />
</p>

<h1 align="center">PageSpy</h1>

> A developer tools for debug remote web page.

## What's this

This repo and [Huolala-Tech/page-spy-web][page-spy-web] work together, where `page-spy` collects information and `page-spy-web` consumes and filters, organizes, and converts information into a standardized format, which is then showed on the page.

## Usage

1. Load a `<script>` in the project:

```html
<script src="https://unpkg.com/@huolala-tech/page-spy@latest/dist/index.min.js"></script>
```

2. Then, config `PageSpy` and init:

```html
<script>
  new PageSpy({
    api: '<api-base-host>', // for example, "example.com"
    clientOrigin: '<debugger-ui-client-origin>', // for example, "https://example.com"
  });
</script>
```

3. That's all! Open your project in browser, there should be a widget (round container with white background and include logo) on the bottom left. If not, check your config.

> It's worth noting that `page-spy` can automatically detect configuration information from `document.currentScript.src`. For instance, if `page-spy` is loaded from "https://xxx.yyy/page-spy/dist/index.min.js" and is initialized with `new PageSpy()`, the api value will be `xxx.yyy`, and the clientOrigin value will be `https://xxx.yyy`.
