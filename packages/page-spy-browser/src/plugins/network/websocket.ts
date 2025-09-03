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

const OriginWebSocket = window.WebSocket;

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
    if (!window.WebSocket) {
      return;
    }

    const plugin = this;
    window.WebSocket = class PageSpyWebSocketProxy extends OriginWebSocket {
      private _requestId: string | null = null;

      private _req: RequestItem | null = null;

      private _lastEventId = 0;

      constructor(url: string | URL, protocols?: string | string[]) {
        super(url, protocols);

        if (url.toString().includes(PAGE_SPY_WS_ENDPOINT)) return;

        this._requestId = getRandomId();
        plugin.createRequest(this._requestId);
        this._req = plugin.getRequest(this._requestId)!;

        // 设置基本请求信息
        this._req.url = url.toString();
        this._req.method = 'GET';
        this._req.requestType = 'websocket';
        this._req.requestHeader = [
          ['Upgrade', 'websocket'],
          ['Connection', 'Upgrade'],
          ['Sec-WebSocket-Version', '13'],
        ];
        if (protocols) {
          const protocolsStr = Array.isArray(protocols)
            ? protocols.join(', ')
            : protocols;
          this._req.requestHeader.push([
            'Sec-WebSocket-Protocol',
            protocolsStr,
          ]);
        }
        this._req.readyState = ReqReadyState.UNSENT;
        this._req.startTime = Date.now();
        this._req.response = null;

        this.setupEventListeners();
      }

      private setupEventListeners() {
        this.addEventListener('open', () => {
          if (!this._req || !this._requestId) return;
          this._req.readyState = ReqReadyState.OPENED;
          this._req.status = 101; // Switching Protocols
          this._req.statusText = 'Switching Protocols';
          this._req.endTime = Date.now();
          this._req.costTime = this._req.endTime - this._req.startTime;
          this._req.responseHeader = [
            ['Upgrade', 'websocket'],
            ['Connection', 'Upgrade'],
          ];
          plugin.sendRequestItem(this._requestId, this._req);
        });

        // 监听消息接收事件
        this.addEventListener('message', (event) => {
          if (!this._req || !this._requestId) return;

          const message: WebSocketMessage = {
            type: 'receive',
            data: event.data,
            timestamp: Date.now(),
          };

          this._req.readyState = ReqReadyState.DONE;
          this._req.status = 200;
          this._req.statusText = 'OK';
          this._req.response = message;
          this._req.endTime = Date.now();
          this._req.costTime = this._req.endTime - this._req.startTime;
          this._req.lastEventId = String(this._lastEventId++);

          plugin.sendRequestItem(this._requestId, this._req);
        });

        // 监听错误事件
        this.addEventListener('error', () => {
          if (!this._req || !this._requestId) return;
          this._req.readyState = ReqReadyState.DONE;
          this._req.status = 400;
          this._req.statusText = 'WebSocket Error';
          this._req.endTime = Date.now();
          this._req.costTime = this._req.endTime - this._req.startTime;

          plugin.sendRequestItem(this._requestId, this._req);
        });

        // 监听连接关闭事件
        this.addEventListener('close', (event) => {
          if (!this._req || !this._requestId) return;
          this._req.readyState = ReqReadyState.DONE;
          this._req.status = event.code;
          this._req.statusText = event.reason || 'Connection Closed';
          this._req.endTime = Date.now();
          this._req.costTime = this._req.endTime - this._req.startTime;

          plugin.sendRequestItem(this._requestId, this._req);
        });
      }

      // 代理 send 方法
      send(data: string | ArrayBufferLike | Blob | ArrayBufferView) {
        if (this._req && this._requestId) {
          const message: WebSocketMessage = {
            type: 'send',
            data: this.formatSendData(data),
            timestamp: Date.now(),
          };

          this._req.readyState = ReqReadyState.DONE;
          this._req.status = 200;
          this._req.statusText = 'OK';
          this._req.response = message;
          this._req.lastEventId = String(this._lastEventId++);
          this._req.endTime = Date.now();
          this._req.costTime = this._req.endTime - this._req.startTime;
          plugin.sendRequestItem(this._requestId, this._req);
        }

        super.send(data);
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
    };
  }

  public onReset() {
    window.WebSocket = OriginWebSocket;
  }
}
