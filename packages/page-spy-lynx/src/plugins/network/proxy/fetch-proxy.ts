import {
  blob2base64Async,
  getRandomId,
  isObjectLike,
  isString,
  psLog,
  Reason,
  MAX_SIZE,
} from '@huolala-tech/page-spy-base';
import LynxNetworkProxyBase from './base';
import {
  markFetchProxyRequestEnd,
  markFetchProxyRequestStart,
} from './xhr-proxy';
import { addContentTypeHeader, getFormattedBody } from '../common';
import { getGlobal } from '../../../utils';

type FetchTarget = {
  host: Record<string, any>;
  fetch: typeof globalThis.fetch;
};

/** 判断 input 是否为当前 Lynx 运行时的 URL 实例。 */
const isLynxURL = (value: unknown): value is URL => {
  const URLCtor = getGlobal().URL;
  return typeof URLCtor === 'function' && value instanceof URLCtor;
};

/** 判断 headers 是否为当前 Lynx 运行时的 Headers 实例。 */
const isLynxHeaders = (value: unknown): value is Headers => {
  const HeadersCtor = getGlobal().Headers;
  return typeof HeadersCtor === 'function' && value instanceof HeadersCtor;
};

/** 安全读取响应头 entries，兼容不完整的 Response 实现。 */
const getResponseHeaderEntries = (headers: Response['headers']) => {
  return typeof headers?.entries === 'function' ? [...headers.entries()] : [];
};

/** 安全读取单个响应头，兼容不完整的 Response 实现。 */
const getResponseHeader = (headers: Response['headers'], key: string) => {
  return typeof headers?.get === 'function' ? headers.get(key) : null;
};

/** 优先 clone Response，避免读取响应体影响业务代码继续消费。 */
const cloneResponse = (res: Response) => {
  return typeof res.clone === 'function' ? res.clone() : res;
};

/** Android/iOS Lynx 原生环境优先代理 lynx.fetch。 */
const isNativeLynxPlatform = (globalObject: Record<string, any>) => {
  const platform = String(
    globalObject.SystemInfo?.platform ||
      globalObject.lynx?.__globalProps?.platform ||
      '',
  ).toLowerCase();
  return platform.includes('android') || platform.includes('ios');
};

/** 找到实际需要被代理的 fetch 宿主对象和原始 fetch 方法。 */
const getFetchTarget = (): FetchTarget | null => {
  const globalObject = getGlobal();
  const globalFetchHost =
    typeof globalThis === 'object' ? (globalThis as Record<string, any>) : null;

  if (
    isNativeLynxPlatform(globalObject) &&
    typeof globalObject.lynx?.fetch === 'function'
  ) {
    return {
      host: globalObject.lynx,
      fetch: globalObject.lynx.fetch,
    };
  }

  if (typeof globalFetchHost?.fetch === 'function') {
    return {
      host: globalFetchHost,
      fetch: globalFetchHost.fetch,
    };
  }

  if (typeof globalObject.lynx?.fetch === 'function') {
    return {
      host: globalObject.lynx,
      fetch: globalObject.lynx.fetch,
    };
  }

  if (typeof globalObject.fetch === 'function') {
    return {
      host: globalObject,
      fetch: globalObject.fetch,
    };
  }

  return null;
};

/** fetch 网络代理：替换运行时 fetch，记录请求、响应和异常状态。 */
export default class FetchProxy extends LynxNetworkProxyBase {
  /** 原始 fetch 方法，reset 时恢复。 */
  public fetch: typeof globalThis.fetch | null = null;

  /** fetch 所属宿主对象，可能是 globalThis、globalObject 或 lynx。 */
  public fetchHost: Record<string, any> | null = null;

  constructor() {
    super();
    this.initProxyHandler();
  }

  /** 恢复被代理前的 fetch 方法。 */
  public reset() {
    if (this.fetch && this.fetchHost) {
      this.fetchHost.fetch = this.fetch;
    }
  }

  /** 安装 fetch 代理，保留业务调用结果，只旁路采集请求信息。 */
  public initProxyHandler() {
    const createRequest = this.createRequest.bind(this);
    const getRequest = this.getRequest.bind(this);
    const sendRequestItem = this.sendRequestItem.bind(this);
    const fetchTarget = getFetchTarget();

    if (!fetchTarget) {
      return;
    }
    const { host, fetch: originFetch } = fetchTarget;
    this.fetch = originFetch;
    this.fetchHost = host;

    host.fetch = function (input: RequestInfo | URL, init: RequestInit = {}) {
      const globalObject = getGlobal();
      markFetchProxyRequestStart();
      let fetchInstance: ReturnType<typeof originFetch>;
      try {
        fetchInstance = originFetch.call(host, input, init);
      } finally {
        markFetchProxyRequestEnd();
      }
      const id = getRandomId();
      createRequest(id);
      const req = getRequest(id);
      if (req) {
        let method = 'GET';
        let url: string | URL;
        let requestHeader: HeadersInit | null = null;

        if (isString(input) || isLynxURL(input)) {
          // input 为字符串或 URL 时，请求信息来自 init。
          method = init.method || 'GET';
          url = input;
          requestHeader = init.headers || null;
        } else {
          // input 为 Request 对象时，请求信息来自对象本身。
          method = input.method;
          url = input.url;
          requestHeader = input.headers;
        }

        req.url =
          typeof globalObject.URL === 'function'
            ? new globalObject.URL(url).toString()
            : String(url);
        req.method = method.toUpperCase();
        req.requestType = 'fetch';
        req.status = 0;
        req.statusText = 'Pending';
        req.startTime = Date.now();
        req.readyState = globalObject.XMLHttpRequest?.UNSENT || 0;

        if (init.credentials && init.credentials !== 'omit') {
          req.withCredentials = true;
        }

        if (isLynxHeaders(requestHeader)) {
          req.requestHeader = [...requestHeader.entries()];
        } else if (isObjectLike(requestHeader)) {
          req.requestHeader = Object.entries(requestHeader);
        } else {
          req.requestHeader = requestHeader;
        }

        if (req.method !== 'GET') {
          // 非 GET 请求额外采集请求体，异步格式化完成后再补发一次请求快照。
          req.requestHeader = addContentTypeHeader(
            req.requestHeader,
            init.body,
          );
          getFormattedBody(init.body).then((res) => {
            req.requestPayload = res;
            sendRequestItem(id, req);
          });
        }
        sendRequestItem(id, req);

        fetchInstance
          .then<string | Blob, never>((res) => {
            // 收到响应头后先上报一次状态，随后再读取响应体。
            req.endTime = Date.now();
            req.costTime = req.endTime - (req.startTime || req.endTime);
            req.status = res.status || 200;
            req.statusText = res.statusText || 'Done';
            req.responseHeader = getResponseHeaderEntries(res.headers);
            req.readyState = globalObject.XMLHttpRequest?.HEADERS_RECEIVED || 2;
            sendRequestItem(id, req);

            const contentType = getResponseHeader(res.headers, 'content-type');
            if (contentType) {
              if (contentType.includes('application/json')) {
                req.responseType = 'json';
                return cloneResponse(res).text();
              }

              if (
                contentType.includes('text/html') ||
                contentType.includes('text/plain')
              ) {
                req.responseType = 'text';
                return cloneResponse(res).text();
              }
            }
            req.responseType = 'blob';
            const cloned = cloneResponse(res);
            if (typeof globalObject.Blob === 'function' && cloned.blob) {
              return cloned.blob();
            }
            return cloned.text();
          })
          .then(async (res) => {
            switch (req.responseType) {
              case 'text':
              case 'json':
                // JSON 响应优先解析成对象，解析失败则按文本展示。
                try {
                  req.response = JSON.parse(res as string);
                } catch {
                  req.response = res;
                  req.responseType = 'text';
                }
                break;
              case 'blob':
                // eslint-disable-next-line no-case-declarations
                const blob = res as Blob;
                // 小体积 Blob 转 base64 展示，大体积只标记原因避免调试链路过载。
                if (
                  typeof globalObject.Blob !== 'function' ||
                  !(blob instanceof globalObject.Blob)
                ) {
                  req.response = res;
                } else if (blob.size <= MAX_SIZE) {
                  try {
                    req.response = await blob2base64Async(blob);
                  } /* c8 ignore start */ catch (e: unknown) {
                    req.response = await blob.text();
                    psLog.error(e instanceof Error ? e.message : String(e));
                  } /* c8 ignore stop */
                } else {
                  req.response = '[object Blob]';
                  req.responseReason = Reason.EXCEED_SIZE;
                }
                break;
              /* c8 ignore next 2 */
              default:
                break;
            }
            req.readyState = globalObject.XMLHttpRequest?.DONE || 4;
            sendRequestItem(id, req);
          })
          .catch((err) => {
            // fetch 本身失败时仍上报一条完整失败记录。
            req.endTime = Date.now();
            req.costTime = req.endTime - (req.startTime || req.endTime);
            req.status = 0;
            req.statusText = err?.message || 'Fetch Error';
            req.readyState = globalObject.XMLHttpRequest?.DONE || 4;
            sendRequestItem(id, req);
          });
      } /* c8 ignore start */ else {
        psLog.warn('The request object is not found on global.fetch event');
      } /* c8 ignore stop */
      return fetchInstance;
    } as WindowOrWorkerGlobalScope['fetch'];
  }
}
