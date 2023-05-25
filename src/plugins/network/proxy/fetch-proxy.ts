import { getRandomId, isString } from 'src/utils';
import { blob2base64Async } from 'src/utils/blob';
import { getURL, MAX_SIZE, Reason } from './common';
import RequestItem from './request-item';
import NetworkProxyBase from './base';

export default class FetchProxy extends NetworkProxyBase {
  fetch: WindowOrWorkerGlobalScope['fetch'] | null = null;

  constructor() {
    super();
    this.initProxyHandler();
  }

  initProxyHandler() {
    const that = this;
    const originFetch = window.fetch;

    /* c8 ignore next 3 */
    if (!originFetch) {
      return;
    }
    this.fetch = originFetch;
    window.fetch = function (input: RequestInfo | URL, init: RequestInit = {}) {
      const id = getRandomId();
      that.reqMap[id] = new RequestItem(id);
      const req = that.reqMap[id];
      let method = 'GET';
      let url: URL;
      let requestHeader: HeadersInit | null;
      let fetchResponse: Response | null;

      if (isString(input)) {
        // when `input` is a string
        /* c8 ignore next */
        method = init.method || 'GET';
        url = getURL(<string>input);
        requestHeader = init?.headers || null;
      } else {
        // when `input` is a `Request` object
        /* c8 ignore next */
        method = (<Request>input).method || 'GET';
        url = getURL((<Request>input).url);
        requestHeader = (<Request>input).headers;
      }

      /* c8 ignore start */
      const query = url.href.split('?') || [];
      req.name = query.shift() || '';
      req.name = req.name.replace(/[/]*$/, '').split('/').pop() || '';
      /* c8 ignore stop */
      req.method = method.toUpperCase();
      req.url = url.toString();
      req.requestType = 'fetch';
      req.status = 0;
      req.statusText = 'Pending';
      req.startTime = Date.now();

      if (init.credentials && init.credentials !== 'omit') {
        req.withCredentials = true;
      }

      if (requestHeader instanceof Headers) {
        req.requestHeader = {};
        requestHeader.forEach((value, key) => {
          (req.requestHeader as Record<string, string>)[key] = value;
        });
      } else {
        req.requestHeader = requestHeader;
      }

      if (url.search) {
        req.name += url.search;
        req.getData = {};
        url.searchParams.forEach((value, key) => {
          req.getData![key] = value;
        });
      }

      /* c8 ignore start */
      if (req.method === 'POST') {
        if (isString(input)) {
          // when `input` is a string
          req.postData = NetworkProxyBase.getFormattedBody(init?.body);
        } else {
          // when `input` is a `Request` object
          // cannot get real type of request's body, so just display "[object Object]"
          req.postData = '[object Object]';
        }
      }
      /* c8 ignore stop */

      const request = isString(input) ? url.toString() : input;

      that.sendRequestItem(id, req);
      const fetchInstance = originFetch(request, init);
      fetchInstance
        .then<string | Blob, never>((res) => {
          fetchResponse = res;
          req.endTime = Date.now();
          /* c8 ignore next 3 */
          req.costTime = req.endTime - (req.startTime || req.endTime);
          req.status = res.status || 200;
          req.statusText = res.statusText || 'Done';
          req.responseHeader = {};
          res.headers.forEach((value, key) => {
            req.responseHeader![key] = value;
          });

          const contentType = res.headers.get('content-type');
          if (contentType) {
            if (contentType.includes('application/json')) {
              req.responseType = 'json';
              return res.clone().text();
            }
            /* c8 ignore start */
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
          /* c8 ignore stop */
        })
        .then(async (res) => {
          /* c8 ignore start */
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
                } catch (e: any) {
                  req.response = await blob.text();
                  console.error(`[PageSpy]: ${e.message}`);
                }
              } else {
                req.response = '[object Blob]';
                req.responseReason = Reason.EXCEED_SIZE;
              }
              break;
            default:
              req.response = res;
              break;
          }
          /* c8 ignore stop */

          return fetchResponse!;
        })
        .finally(() => {
          fetchResponse = null;
          req.readyState = 4;
          that.sendRequestItem(id, req);
        });
      return fetchInstance;
    };
  }
}
