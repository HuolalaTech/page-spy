# 插件

## 插件的定义

```ts
import { SocketStoreType } from '@huolala-tech/page-spy-types/lib/base';
import { InitConfig } from 'types';

export abstract class PageSpyPlugin {
  /**
   * 每个插件都要求指定 name，会作为当前插件的 "身份标识"
   * 在 PageSpy 内部的注册插件、禁用插件的功能都依赖 name 属性
   */
  public abstract name: string;

  /**
   * `new PageSpy()` 时调用
   */
  public abstract onInit: (params: OnInitParams) => any;

  /**
   * 在 PageSpy 渲染完成后调用（如果有渲染过程的话）
   */
  public abstract onMounted?: (params: OnMountedParams) => any;

  /**
   * 当用户不再需要 PageSpy 时，插件应具备 重置/恢复 功能
   */
  public abstract onReset?: () => any;
}

export interface OnInitParams {
  /**
   * 已经合并了用户传入的关于 PageSpy 实例化参数的配置信息
   */
  config: Required<InitConfig>;

  /**
   * 包装了 socket 实例，插件开发者可以通过该属性与调试端 / API 交互
   */
  socketStore: SocketStoreType;
}

export interface OnMountedParams {
  // PageSpy 渲染的根节点
  root?: HTMLDivElement;

  // PageSpy 渲染的弹窗的根节点
  content?: HTMLDivElement;

  // 包装了 socket 实例，插件开发者可以通过该属性与调试端 / API 交互
  socketStore: SocketStoreType;
}
```

## 行为约定

如果当前插件会收集（或者希望对外公开）平台的某种行为「数据」，那么除了在 `socketStore` 广播数据外，我们约定插件在 `socketStore` 实例上额外派发一个 "public-data" 内部事件（Internal Event）。此举的目的是为了满足有统计需求或者持久化需求的插件能够从这个事件中统一收集数据，插件如果觉得某类数据不应该被 “公开”，则无需派发 "public-data" 事件。

## 插件实现案例

案例说明：通过 rrweb 在客户端录制 DOM，功能包含：

- 在客户端弹窗中新增一个 "下载录制数据" 按钮；按钮点击后开始下载文件；
- 监听调试端的事件消息，并和调试端交互；

```ts
import { record } from 'rrweb';
import { eventWithTime } from '@rrweb/types';
import {
  SpyMessage,
  PageSpyPlugin,
  OnInitParams,
  OnMountedParams,
} from '@huolala-tech/page-spy-types';

type Options = Parameters<typeof record>[number];

export default class RRWebRecordPlugin implements PageSpyPlugin {
  name = 'RRWebRecordPlugin';

  events: eventWithTime[] = [];

  private static hasInited = false;

  private static hasMounted = false;

  constructor(public options: Options = {}) {}

  onInit({ socketStore }: OnInitParams) {
    if (RRWebRecordPlugin.hasInited) return;
    RRWebRecordPlugin.hasInited = true;

    record({
      ...this.options,
      emit(event) {
        // 构造要发出去的数据
        const message: SpyMessage.MessageItem = {
          type: 'rrweb-event',
          role: 'client',
          data: event,
        };
        // 通过 socketStore 广播数据
        socketStore.broadcastMessage(message);
        // 同时派发 "public-data" 事件
        socketStore.dispatchEvent('public-data', message);
      },
    });

    // 监听调试端发过来的事件
    // 这里的 "rrweb-cache" 假设是由调试端发过来的一个 ws "事件" 消息
    socketStore.addListener('rrweb-cache', ({ source }, reply) => {
      // source.data - 调试端发过来的参数
      const params = source.data;
      // 插件处理逻辑
      // const result: SpyMessage.MessageItem = ...
      // 调用 reply(...), socketStore 会负责将数据单播给指定调试端
      reply(result);
    });
  }

  onMounted({ content, socketStore }: OnMountedParams) {
    if (RRWebRecordPlugin.hasMounted) return;
    RRWebRecordPlugin.hasMounted = true;

    const recordBtn = document.createElement('div');
    recordBtn.id = 'download-rrweb-event';
    // "page-spy-content__btn" 类可以复用按钮样式
    recordBtn.className = 'page-spy-content__btn';
    recordBtn.innerText = '下载录制数据';
    recordBtn.addEventListener('click', () => {
      const data = new Blob([JSON.stringify(this.events)], {
        type: 'application/json',
      });
      const url = URL.createObjectURL(data);

      const a = document.createElement('a');
      a.download = `${new Date().toLocaleString()}.json`;
      a.href = url;
      a.style.display = 'none';
      document.body.appendChild(a);
      a.click();

      URL.revokeObjectURL(url);
      document.body.removeChild(a);
    });

    content.appendChild(recordBtn);
  }

  // 当用户调用 $pageSpy.abort() 时会触发 `onReset()`
  onReset() {
    RRWebRecordPlugin.hasInited = false;
    RRWebRecordPlugin.hasMounted = false;
    const root = document.getElementById('download-rrweb-event');
    if (root) {
      root.remove();
    }
  }
}
```

## 插件的使用方式

```html
<!-- 引入 SDK -->
<script src="https://<your-host>/page-spy/index.min.js"></script>
<!-- 引入插件 -->
<script src="https://<your-host>/plugins/rrweb-record.min.js"></script>

<!-- 注册插件 -->
<script>
  PageSpy.registerPlugin(new RRWebRecordPlugin());
  window.$pageSpy = new PageSpy();
</script>
```
