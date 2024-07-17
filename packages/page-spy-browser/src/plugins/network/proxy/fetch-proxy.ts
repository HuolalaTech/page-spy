import {
  blob2base64Async,
  getRandomId,
  isHeaders,
  isObjectLike,
  isString,
  isURL,
  psLog,
  addContentTypeHeader,
  getFormattedBody,
  MAX_SIZE,
  Reason,
} from '@huolala-tech/page-spy-base';
import WebNetworkProxyBase from './base';

export default class FetchProxy extends WebNetworkProxyBase {
  public fetch: WindowOrWorkerGlobalScope['fetch'] | null = null;

  constructor() {
    super();
    this.initProxyHandler();
  }

  public reset() {
    if (this.fetch) {
      window.fetch = this.fetch;
    }
  }

  public initProxyHandler() {
    const that = this;
    const originFetch = window.fetch;

    if (!originFetch) {
      return;
    }
    this.fetch = originFetch;
    window.fetch = function (input: RequestInfo | URL, init: RequestInit = {}) {
      const fetchInstance = originFetch(input, init);

      const id = getRandomId();
      that.createRequest(id);
      const req = that.getRequest(id);
      if (req) {
        let method = 'GET';
        let url: string | URL;
        let requestHeader: HeadersInit | null = null;

        if (isString(input) || isURL(input)) {
          // when `input` is a string
          method = init.method || 'GET';
          url = input;
          requestHeader = init.headers || null;
        } else {
          // when `input` is a `Request` object
          method = input.method;
          url = input.url;
          requestHeader = input.headers;
        }

        req.url = new URL(url, window.location.href).toString();
        req.method = method.toUpperCase();
        req.requestType = 'fetch';
        req.status = 0;
        req.statusText = 'Pending';
        req.startTime = Date.now();
        req.readyState = XMLHttpRequest.UNSENT;

        if (init.credentials && init.credentials !== 'omit') {
          req.withCredentials = true;
        }

        if (requestHeader) {
          if (isHeaders(requestHeader)) {
            req.requestHeader = [...requestHeader.entries()];
          } else if (isObjectLike(requestHeader)) {
            req.requestHeader = Object.entries(requestHeader).map(([k, v]) => [
              String(k),
              String(v),
            ]);
          } else {
            req.requestHeader = requestHeader.map(([k, v]) => [
              String(k),
              String(v),
            ]);
          }
        }

        if (req.method !== 'GET') {
          req.requestHeader = addContentTypeHeader(
            req.requestHeader,
            init.body,
          );
          getFormattedBody(init.body).then((res) => {
            req.requestPayload = res;
            that.sendRequestItem(id, req);
          });
        }
        that.sendRequestItem(id, req);

        fetchInstance
          .then<string | Blob, never>((res) => {
            // Headers received
            req.endTime = Date.now();
            req.costTime = req.endTime - (req.startTime || req.endTime);
            req.status = res.status || 200;
            req.statusText = res.statusText || 'Done';
            req.responseHeader = [...res.headers.entries()];
            req.readyState = XMLHttpRequest.HEADERS_RECEIVED;
            that.sendRequestItem(id, req);

            const contentType = res.headers.get('content-type');
            if (contentType) {
              if (contentType.includes('application/json')) {
                req.responseType = 'json';
                return res.clone().text();
              }

              if (
                contentType.includes('text/html') ||
                contentType.includes('text/plain')
              ) {
                req.responseType = 'text';
                return res.clone().text();
              }
            }
            req.responseType = 'blob';
            return res.clone().blob();
          })
          .then(async (res) => {
            switch (req.responseType) {
              case 'text':
              case 'json':
                try {
                  req.response = JSON.parse(res as string);
                } catch (e) {
                  req.response = res;
                  req.responseType = 'text';
                }
                break;
              case 'blob':
                // eslint-disable-next-line no-case-declarations
                const blob = res as Blob;
                if (blob.size <= MAX_SIZE) {
                  try {
                    req.response = await blob2base64Async(blob);
                  } /* c8 ignore start */ catch (e: any) {
                    req.response = await blob.text();
                    psLog.error(e.message);
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
          })
          .finally(() => {
            req.readyState = XMLHttpRequest.DONE;
            that.sendRequestItem(id, req);
          });
      } /* c8 ignore start */ else {
        psLog.warn('The request object is not found on window.fetch event');
      } /* c8 ignore stop */
      return fetchInstance;
    };
  }
}
