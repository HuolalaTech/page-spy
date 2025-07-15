/* eslint-disable @typescript-eslint/brace-style */
import {
  getRandomId,
  RequestItem,
  ReqReadyState,
  NetworkProxyBase,
  PAGE_SPY_WS_ENDPOINT,
  WebSocketMessage,
} from '@huolala-tech/page-spy-base';
import { OnInitParams, PageSpyPlugin } from '@huolala-tech/page-spy-types';
import WebNetworkProxyBase from './proxy/base';
import { InitConfig } from '../../config';

const OriginWebSocket = globalThis.WebSocket;

export default class WebSocketPlugin
  extends WebNetworkProxyBase
  implements PageSpyPlugin
{
  public name = 'WebSocketPlugin';

  public static hasInitd = false;

  public onInit({ config }: OnInitParams<InitConfig>) {
    if (WebSocketPlugin.hasInitd) return;
    WebSocketPlugin.hasInitd = true;
    NetworkProxyBase.dataProcessor = config.dataProcessor.network;

    this.initProxyHandler();
  }

  public initProxyHandler() {
    if (!globalThis.WebSocket) {
      return;
    }

    const _wsProxy = this;
    globalThis.WebSocket = class PageSpyWebSocketProxy {
      private ws: WebSocket | null = null;

      private requestId: string | null = null;

      private req: RequestItem | null = null;

      private id = 0;

      constructor(url: string, protocols?: string | string[]) {
        const { pathname } = new URL(url);
        if (pathname.startsWith(PAGE_SPY_WS_ENDPOINT)) {
          // @ts-ignore
          // eslint-disable-next-line no-constructor-return
          return new OriginWebSocket(url, protocols);
        }

        this.requestId = getRandomId();
        _wsProxy.createRequest(this.requestId);
        this.req = _wsProxy.getRequest(this.requestId)!;

        // 设置基本请求信息
        this.req.url = url.toString();
        this.req.method = 'GET';
        this.req.requestType = 'websocket';
        this.req.requestHeader = [
          ['Upgrade', 'websocket'],
          ['Connection', 'Upgrade'],
          ['Sec-WebSocket-Version', '13'],
        ];
        if (protocols) {
          const protocolsStr = Array.isArray(protocols)
            ? protocols.join(', ')
            : protocols;
          this.req.requestHeader.push(['Sec-WebSocket-Protocol', protocolsStr]);
        }
        this.req.readyState = ReqReadyState.UNSENT;
        this.req.startTime = Date.now();
        this.req.response = null;

        // 创建原生 WebSocket 实例
        this.ws = new OriginWebSocket(url, protocols);
        this.setupEventListeners();

        // 返回代理对象
        const proxy = new Proxy(this, {
          get(target, prop) {
            if (prop in target) {
              return (target as any)[prop];
            }
            const value = (target.ws as any)[prop];
            return typeof value === 'function' ? value.bind(target.ws) : value;
          },
          set(target, prop, value) {
            if (prop in target) {
              (target as any)[prop] = value;
            } else {
              (target.ws as any)[prop] = value;
            }
            return true;
          },
        });

        // eslint-disable-next-line no-constructor-return
        return proxy;
      }

      private setupEventListeners() {
        if (!this.ws) {
          return;
        }

        // 监听连接打开事件
        this.ws.addEventListener('open', () => {
          if (!this.req || !this.requestId) return;
          this.req.readyState = ReqReadyState.OPENED;
          this.req.status = 101; // Switching Protocols
          this.req.statusText = 'Switching Protocols';
          this.req.endTime = Date.now();
          this.req.costTime = this.req.endTime - this.req.startTime;
          this.req.responseHeader = [
            ['Upgrade', 'websocket'],
            ['Connection', 'Upgrade'],
          ];
          _wsProxy.sendRequestItem(this.requestId, this.req);
        });

        // 监听消息接收事件
        this.ws.addEventListener('message', (event) => {
          if (!this.req || !this.requestId) return;

          const message: WebSocketMessage = {
            type: 'receive',
            data: event.data,
            timestamp: Date.now(),
          };

          this.req.readyState = ReqReadyState.DONE;
          this.req.status = 200;
          this.req.statusText = 'OK';
          this.req.response = message;
          this.req.endTime = Date.now();
          this.req.costTime = this.req.endTime - this.req.startTime;
          this.req.lastEventId = String(this.id++);

          _wsProxy.sendRequestItem(this.requestId, this.req);
        });

        // 监听错误事件
        this.ws.addEventListener('error', () => {
          if (!this.req || !this.requestId) return;
          this.req.readyState = ReqReadyState.DONE;
          this.req.status = 400;
          this.req.statusText = 'WebSocket Error';
          this.req.endTime = Date.now();
          this.req.costTime = this.req.endTime - this.req.startTime;

          _wsProxy.sendRequestItem(this.requestId, this.req);
        });

        // 监听连接关闭事件
        this.ws.addEventListener('close', (event) => {
          if (!this.req || !this.requestId) return;
          this.req.readyState = ReqReadyState.DONE;
          this.req.status = event.code;
          this.req.statusText = event.reason || 'Connection Closed';
          this.req.endTime = Date.now();
          this.req.costTime = this.req.endTime - this.req.startTime;

          _wsProxy.sendRequestItem(this.requestId, this.req);
        });
      }

      // 代理 send 方法
      send(data: string | ArrayBufferLike | Blob | ArrayBufferView) {
        if (this.req && this.requestId) {
          const message: WebSocketMessage = {
            type: 'send',
            data: this.formatSendData(data),
            timestamp: Date.now(),
          };

          this.req.readyState = ReqReadyState.DONE;
          this.req.status = 200;
          this.req.statusText = 'OK';
          this.req.response = message;
          this.req.lastEventId = String(this.id++);
          this.req.endTime = Date.now();
          this.req.costTime = this.req.endTime - this.req.startTime;
          _wsProxy.sendRequestItem(this.requestId, this.req);
        }
        // 调用原生 send 方法
        return this.ws?.send(data);
      }

      close(code?: number, reason?: string) {
        return this.ws?.close(code, reason);
      }

      private formatSendData(
        data: string | ArrayBufferLike | Blob | ArrayBufferView,
      ): string {
        if (typeof data === 'string') {
          return data;
        }
        if (data instanceof Blob) {
          return '[Blob data]';
        }
        if (data instanceof ArrayBuffer || ArrayBuffer.isView(data)) {
          return '[Binary data]';
        }
        return String(data);
      }
    } as any;
  }

  public onReset() {
    globalThis.WebSocket = OriginWebSocket;
  }
}
