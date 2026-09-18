import {
  RequestItem,
  blob2base64Async,
  toStringTag,
  isArrayBuffer,
  getObjectKeys,
  getRandomId,
  isString,
  psLog,
  Reason,
  MAX_SIZE,
} from '@huolala-tech/page-spy-base';
import LynxNetworkProxyBase from './base';
import { addContentTypeHeader, getFormattedBody } from '../common';
import { getGlobal } from '../../../utils';

const isLynxBlob = (value: unknown): value is Blob => {
  const BlobCtor = getGlobal().Blob;
  return typeof BlobCtor === 'function' && value instanceof BlobCtor;
};

/**
 * React native use whatwg-fetch to polyfill fetch API based on xhr, so it's
 * no need to proxy fetch since we already proxy xhr.
 * But there is one problem: whatwg-fetch will set responseType of xhr to 'blob',
 * which will make our response logic confused.
 *
 * The solution is: we proxy the fetch function and mark fetch-originated XHR
 * requests in memory, then still handle all proxy logic in fetch. Older SDK
 * builds used 'page-spy-is-fetch' as a request header, so XHR keeps recognizing
 * it for compatibility, but fetch must not add that header to outgoing requests
 * because it can trigger CORS preflight failures.
 */
export const IS_FETCH_HEADER = 'page-spy-is-fetch';

let fetchProxyRequestDepth = 0;

/** 标记当前正在由 fetch 代理触发底层 XHR，避免重复采集。 */
export const markFetchProxyRequestStart = () => {
  fetchProxyRequestDepth += 1;
};

/** 结束 fetch 触发 XHR 的标记，使用深度计数兼容嵌套调用。 */
export const markFetchProxyRequestEnd = () => {
  fetchProxyRequestDepth = Math.max(0, fetchProxyRequestDepth - 1);
};

const isFetchProxyRequestInFlight = () => fetchProxyRequestDepth > 0;

declare global {
  interface XMLHttpRequest {
    pageSpyRequestId: string;
    pageSpyRequestMethod: string;
    pageSpyRequestUrl: string;
    // 来自上层 fetch 时，XHR 代理不再重复处理。
    isFetch?: boolean;
  }
}
/** XHR 网络代理：改写 open/send/setRequestHeader 采集请求生命周期。 */
class XhrProxy extends LynxNetworkProxyBase {
  /** 原始 open 方法，reset 时恢复。 */
  public xhrOpen: XMLHttpRequest['open'] | null = null;

  /** 原始 send 方法，reset 时恢复。 */
  public xhrSend: XMLHttpRequest['send'] | null = null;

  /** 原始 setRequestHeader 方法，reset 时恢复。 */
  public xhrSetRequestHeader: XMLHttpRequest['setRequestHeader'] | null = null;

  public constructor() {
    super();
    this.initProxyHandler();
  }

  /** 安装 XHR 原型代理，按 readyState 推送请求状态。 */
  public initProxyHandler() {
    const XHR = getGlobal().XMLHttpRequest as typeof XMLHttpRequest | undefined;
    if (
      typeof XHR !== 'function' ||
      !XHR.prototype?.open ||
      !XHR.prototype?.send ||
      !XHR.prototype?.setRequestHeader
    ) {
      return;
    }
    const that = this;
    const { open, send, setRequestHeader } = XHR.prototype;
    this.xhrOpen = open;
    this.xhrSend = send;
    this.xhrSetRequestHeader = setRequestHeader;

    XHR.prototype.open = function (...args: any[]) {
      // open 阶段创建请求记录并缓存方法、URL，真正发送信息在 send 阶段补齐。
      const XMLReq = this;
      const method = args[0];
      const url = args[1];
      const id = getRandomId();
      that.createRequest(id);

      this.pageSpyRequestId = id;
      this.pageSpyRequestMethod = method;
      this.pageSpyRequestUrl = url;

      if (isFetchProxyRequestInFlight()) {
        // 由 fetch 代理触发的底层 XHR 只保留 fetch 侧记录。
        this.isFetch = true;
        that.removeRequest(id);
      }

      return open.apply(XMLReq, args as any);
    };

    XHR.prototype.setRequestHeader = function (key, value) {
      // 兼容旧版本：该 header 表示请求来自上层 fetch，不需要 XHR 代理重复采集。
      if (key === IS_FETCH_HEADER) {
        this.isFetch = true;
        that.removeRequest(this.pageSpyRequestId);
        return;
      }
      const req = that.getRequest(this.pageSpyRequestId);
      if (req) {
        if (!req.requestHeader) {
          req.requestHeader = [];
        }
        req.requestHeader.push([key, value]);
      } /* c8 ignore start */ else if (!this.isFetch) {
        psLog.warn(
          "The request object is not found on XMLHttpRequest's setRequestHeader event",
        );
      } /* c8 ignore stop */
      setRequestHeader.apply(this, [key, value]);
    };

    XHR.prototype.send = function (body) {
      const XMLReq = this;
      const {
        pageSpyRequestId,
        pageSpyRequestMethod = 'GET',
        pageSpyRequestUrl = '',
      } = XMLReq;
      const req = that.getRequest(pageSpyRequestId);

      /** readystatechange 监听放在 send 阶段，避免 fetch 触发的 XHR 在 open 后被忽略，
       * 却已经提前触发 readystatechange，导致调试面板出现没有后续响应的空请求行。
       */
      XMLReq.addEventListener('readystatechange', async () => {
        if (req) {
          req.readyState = XMLReq.readyState;

          switch (XMLReq.readyState) {
            /* c8 ignore next */
            case XMLReq.UNSENT:
            case XMLReq.OPENED:
              req.status = XMLReq.status;
              req.statusText = 'Pending';
              if (!req.startTime) {
                req.startTime = Date.now();
              }
              break;
            // 收到响应头。
            case XMLReq.HEADERS_RECEIVED:
              req.status = XMLReq.status;
              req.statusText = 'Loading';
              const header = XMLReq.getAllResponseHeaders() || '';
              const headerArr = header.trim().split(/[\r\n]+/);
              req.responseHeader = headerArr.reduce(
                (acc, cur) => {
                  const [headerKey, ...parts] = cur.split(': ');
                  acc.push([headerKey, parts.join(': ')]);
                  return acc;
                },
                [] as [string, string][],
              );
              break;
            // 响应体加载中。
            case XMLReq.LOADING:
              req.status = XMLReq.status;
              req.statusText = 'Loading';
              break;
            // 请求完成，格式化响应体并上报最终状态。
            case XMLReq.DONE:
              req.status = XMLReq.status;
              req.statusText = 'Done';
              req.endTime = Date.now();
              req.costTime = req.endTime - (req.startTime || req.endTime);

              let { responseType } = XMLReq;
              if (
                !responseType ||
                (XMLReq.isFetch && responseType === 'blob')
              ) {
                const contentType = XMLReq.getResponseHeader('content-type');
                if (contentType) {
                  if (contentType.includes('application/json')) {
                    responseType = 'json';
                  }

                  if (
                    contentType.includes('text/html') ||
                    contentType.includes('text/plain')
                  ) {
                    responseType = 'text';
                  }
                }
              }
              if (!responseType) {
                responseType = 'blob';
              }
              req.responseType = responseType;
              const formatResult = await that.formatResponse(
                XMLReq,
                responseType,
              );
              getObjectKeys(formatResult).forEach((key) => {
                req[key] = formatResult[key];
              });
              break;
            /* c8 ignore next 4 */
            default:
              req.status = XMLReq.status;
              req.statusText = 'Unknown';
              break;
          }
          that.sendRequestItem(XMLReq.pageSpyRequestId, req);
        } /* c8 ignore start */ else if (!this.isFetch) {
          psLog.warn(
            "The request object is not found on XMLHttpRequest's readystatechange event",
          );
        }
        /* c8 ignore stop */
      });

      if (req) {
        // send 阶段补齐请求信息和请求体，避免 open 阶段缺少 body。
        const URLCtor = getGlobal().URL;
        req.url =
          typeof URLCtor === 'function'
            ? new URLCtor(pageSpyRequestUrl).toString()
            : String(pageSpyRequestUrl);
        req.method = pageSpyRequestMethod.toUpperCase();
        req.requestType = 'xhr';
        req.withCredentials = XMLReq.withCredentials;
        if (req.method !== 'GET') {
          req.requestHeader = addContentTypeHeader(req.requestHeader, body);
          getFormattedBody(body).then((res) => {
            req.requestPayload = res;
            that.sendRequestItem(XMLReq.pageSpyRequestId, req);
          });
        }
      } /* c8 ignore start */ else if (!this.isFetch) {
        psLog.warn(
          "The request object is not found on XMLHttpRequest's send event",
        );
      } /* c8 ignore stop */
      return send.apply(XMLReq, [body]);
    };
  }

  /** 恢复 XHR 原型上的原始方法。 */
  public reset() {
    const XHR = getGlobal().XMLHttpRequest as typeof XMLHttpRequest | undefined;
    if (typeof XHR !== 'function' || !XHR.prototype) {
      return;
    }
    if (this.xhrOpen) {
      XHR.prototype.open = this.xhrOpen;
    }
    if (this.xhrSend) {
      XHR.prototype.send = this.xhrSend;
    }
    if (this.xhrSetRequestHeader) {
      XHR.prototype.setRequestHeader = this.xhrSetRequestHeader;
    }
  }

  // eslint-disable-next-line class-methods-use-this
  /** 按 XHR responseType 格式化响应体，供调试面板展示。 */
  public async formatResponse(
    XMLReq: XMLHttpRequest,
    type: XMLHttpRequestResponseType,
  ) {
    const result: {
      response: RequestItem['response'];
      responseReason: RequestItem['responseReason'];
    } = {
      response: '',
      responseReason: null,
    } as const;

    // XHR 响应格式化依赖 responseType；fetch 则主要依赖 content-type 推断。
    switch (type) {
      case '':
      case 'text':
        if (isString(XMLReq.response)) {
          try {
            result.response = JSON.parse(XMLReq.response);
          } catch (e) {
            // 非 JSON 字符串时按原文本展示。
            result.response = XMLReq.response;
          }
        } /* c8 ignore start */ else if (
          typeof XMLReq.response !== 'undefined'
        ) {
          result.response = toStringTag(XMLReq.response);
        }
        /* c8 ignore stop */
        break;
      case 'json':
        if (typeof XMLReq.response !== 'undefined') {
          result.response = XMLReq.response;
        }
        break;
      case 'blob':
      case 'arraybuffer':
        if (XMLReq.response) {
          // ArrayBuffer 尽量转成 Blob 后复用 Blob 的体积限制和 base64 格式化逻辑。
          let blob = XMLReq.response;
          if (isArrayBuffer(blob)) {
            const contentType = XMLReq.getResponseHeader('content-type');
            const BlobCtor = getGlobal().Blob;
            if (contentType && typeof BlobCtor === 'function') {
              blob = new BlobCtor([blob], { type: contentType });
            }
          }
          if (isLynxBlob(blob)) {
            if (blob.size <= MAX_SIZE) {
              try {
                result.response = await blob2base64Async(blob);
              } /* c8 ignore start */ catch (e: unknown) {
                result.response = await blob.text();
                psLog.error(e instanceof Error ? e.message : String(e));
              } /* c8 ignore stop */
            } else {
              result.response = '[object Blob]';
              result.responseReason = Reason.EXCEED_SIZE;
            }
          }
        }
        break;
      case 'document':
      default:
        if (typeof XMLReq.response !== 'undefined') {
          result.response = Object.prototype.toString.call(XMLReq.response);
        }
        break;
    }
    return result;
  }
}

export default XhrProxy;
