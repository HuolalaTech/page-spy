/* eslint-disable @typescript-eslint/brace-style */
import {
  NetworkProxyBase,
  WebSocketMessage,
  PAGE_SPY_WS_ENDPOINT,
  ReqReadyState,
} from '@huolala-tech/page-spy-base';
import { OnInitParams, PageSpyPlugin } from '@huolala-tech/page-spy-types';
import {
  getRandomId,
  psLog,
  toStringTag,
} from '@huolala-tech/page-spy-base/dist/utils';
import MPNetworkProxyBase from './proxy/base';
import { InitConfig } from '../../config';
import { getOriginMPSDK } from '../../helpers/mp-api';
import { MPNetworkAPI, MPSocket, SendSocketMessageOptions } from '../../types';

const formatData = (data: string | ArrayBuffer) => {
  if (typeof data === 'string') {
    return data;
  }
  return toStringTag(data);
};

export default class WebSocketPlugin
  extends MPNetworkProxyBase
  implements PageSpyPlugin
{
  public name = 'WebSocketPlugin';

  public static hasInitd = false;

  // 保存原始的 connectSocket 方法
  public originConnectSocket: MPNetworkAPI['connectSocket'] | null = null;

  public onInit({ config }: OnInitParams<InitConfig>) {
    if (WebSocketPlugin.hasInitd) return;
    WebSocketPlugin.hasInitd = true;
    NetworkProxyBase.dataProcessor = config.dataProcessor.network;

    this.initProxyHandler();
  }

  public initProxyHandler() {
    const that = this;
    const mp = getOriginMPSDK();
    const originConnectSocket = mp.connectSocket;

    if (!originConnectSocket) {
      psLog.warn('"connectSocket" is not available');
      return;
    }

    this.originConnectSocket = originConnectSocket;

    Object.defineProperty(mp, 'connectSocket', {
      value(params: Parameters<MPNetworkAPI['connectSocket']>[0]) {
        const task = originConnectSocket(params);
        if (params.url.includes(PAGE_SPY_WS_ENDPOINT)) {
          return task;
        }

        const id = getRandomId();
        that.createRequest(id);
        const req = that.getRequest(id);

        if (req) {
          req.url = params.url;
          req.method = 'GET';
          req.requestType = 'websocket';
          req.status = 0;
          req.statusText = 'Connecting';
          req.startTime = Date.now();
          req.readyState = ReqReadyState.UNSENT;

          // 处理请求头
          if (params.header) {
            req.requestHeader = Object.entries(params.header).map(([k, v]) => [
              String(k),
              String(v),
            ]);
          } else {
            req.requestHeader = [];
          }

          that.sendRequestItem(id, req);

          const socketTask = originConnectSocket(params);

          // 如果是 Promise，需要等待解析
          if (socketTask instanceof Promise) {
            return socketTask.then((t) => {
              return that.proxySocketTask(t, id);
            });
          }

          // 代理 SocketTask
          return that.proxySocketTask(socketTask, id);
        }

        psLog.warn('Failed to create WebSocket request object');
        return task;
      },
      configurable: true,
      writable: true,
      enumerable: true,
    });
  }

  private proxySocketTask(socketTask: MPSocket, requestId: string): MPSocket {
    const that = this;
    const req = this.getRequest(requestId);
    if (!req) return socketTask;

    const originalOnOpen = socketTask.onOpen.bind(socketTask);
    const originalOnClose = socketTask.onClose.bind(socketTask);
    const originalOnError = socketTask.onError.bind(socketTask);
    const originalOnMessage = socketTask.onMessage.bind(socketTask);
    const originalSend = socketTask.send.bind(socketTask);
    const originalClose = socketTask.close.bind(socketTask);

    socketTask.onOpen = function (handler) {
      return originalOnOpen((res) => {
        req.status = 101;
        req.statusText = 'Connected';
        req.readyState = ReqReadyState.OPENED;
        req.endTime = Date.now();
        req.costTime = req.endTime - (req.startTime || req.endTime);

        // 处理响应头
        if (res.header) {
          req.responseHeader = Object.entries(res.header).map(([k, v]) => [
            String(k),
            String(v),
          ]);
        }

        that.sendRequestItem(requestId, req);

        // 调用用户的处理函数
        if (handler) {
          handler(res);
        }
      });
    };

    socketTask.onClose = function (handler) {
      return originalOnClose((res) => {
        req.status = res.code;
        req.statusText = 'Closed';
        req.readyState = ReqReadyState.DONE;
        req.endTime = Date.now();
        req.costTime = req.endTime - (req.startTime || req.endTime);

        that.sendRequestItem(requestId, req);

        if (handler) {
          handler(res);
        }
      });
    };

    socketTask.onError = function (handler) {
      return originalOnError((err) => {
        req.status = 0;
        req.statusText = 'Error';
        req.readyState = ReqReadyState.DONE;
        req.endTime = Date.now();
        req.costTime = req.endTime - (req.startTime || req.endTime);

        that.sendRequestItem(requestId, req);

        // 调用用户的处理函数
        if (handler) {
          handler(err);
        }
      });
    };

    socketTask.onMessage = function (handler) {
      return originalOnMessage(({ data }) => {
        const message: WebSocketMessage = {
          type: 'receive',
          data: typeof data === 'string' ? data : '[object ArrayBuffer]',
          timestamp: Date.now(),
        };
        req.response = message;

        that.sendRequestItem(requestId, req);

        if (handler) {
          handler(message);
        }
      });
    };

    socketTask.send = function (params) {
      const originalSuccess = params.success;

      const wrappedParams: SendSocketMessageOptions = {
        ...params,
        success: (res) => {
          // 只有真的发送成功了，才发给 PageSpy
          const data = formatData(params.data);
          const message: WebSocketMessage = {
            type: 'send',
            data,
            timestamp: Date.now(),
          };
          req.response = message;
          that.sendRequestItem(requestId, req);

          if (originalSuccess) {
            originalSuccess(res);
          }
        },
      };

      return originalSend(wrappedParams);
    };

    // 代理 close 方法
    socketTask.close = function (params) {
      // 更新关闭状态
      req.status = params.code || 1000; // 正常关闭
      req.statusText = 'Closing';
      req.readyState = ReqReadyState.LOADING;

      that.sendRequestItem(requestId, req);

      return originalClose(params);
    };

    return socketTask;
  }

  public onReset() {
    if (this.originConnectSocket) {
      const mp = getOriginMPSDK();
      Object.defineProperty(mp, 'connectSocket', {
        value: this.originConnectSocket,
        configurable: true,
        writable: true,
        enumerable: true,
      });
      this.originConnectSocket = null;
    }
  }
}
