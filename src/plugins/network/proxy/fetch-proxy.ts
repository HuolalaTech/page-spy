import {
  getRandomId,
  isHeaders,
  isObjectLike,
  isString,
  isURL,
} from 'src/utils';
import { blob2base64Async } from 'src/utils/blob';
import {
  addContentTypeHeader,
  getFormattedBody,
  isOkStatusCode,
  MAX_SIZE,
  Reason,
  resolveUrlInfo,
} from './common';
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

    if (!originFetch) {
      return;
    }
    this.fetch = originFetch;
    window.fetch = function (input: RequestInfo | URL, init: RequestInit = {}) {
      const id = getRandomId();
      that.reqMap[id] = new RequestItem(id);
      const req = that.reqMap[id];
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

      const urlInfo = resolveUrlInfo(url);
      req.url = urlInfo.url;
      req.name = urlInfo.name;
      req.getData = urlInfo.query;

      req.method = method.toUpperCase();
      req.requestType = 'fetch';
      req.status = 0;
      req.statusText = 'Pending';
      req.startTime = Date.now();

      if (init.credentials && init.credentials !== 'omit') {
        req.withCredentials = true;
      }

      if (isHeaders(requestHeader)) {
        req.requestHeader = [...requestHeader.entries()];
      } else if (isObjectLike(requestHeader)) {
        req.requestHeader = Object.entries(requestHeader);
      } else {
        req.requestHeader = requestHeader;
      }

      if (req.method !== 'GET') {
        req.requestHeader = addContentTypeHeader(req.requestHeader, init.body);
        getFormattedBody(init.body).then((res) => {
          req.requestPayload = res;
          that.sendRequestItem(id, req);
        });
      }

      that.sendRequestItem(id, req);
      const fetchInstance = originFetch(input, init);
      fetchInstance
        .then<string | Blob, never>((res) => {
          req.endTime = Date.now();
          req.costTime = req.endTime - (req.startTime || req.endTime);
          req.status = res.status || 200;
          req.statusText = res.statusText || 'Done';
          req.responseHeader = [...res.headers.entries()];

          if (!isOkStatusCode(res.status)) return '';
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
              break;
          }
        })
        .finally(() => {
          req.readyState = 4;
          that.sendRequestItem(id, req);
        });
      return fetchInstance;
    };
  }
}
