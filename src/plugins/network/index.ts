// eslint-disable no-case-declarations
import { makeMessage, DEBUG_MESSAGE_TYPE } from 'src/utils/message';
import socketStore from 'src/utils/socket';
import { blob2base64 } from 'src/utils/blob';
import {
  getContentType,
  getPrototypeName,
  getRandomId,
  isArrayBuffer,
  isBlob,
  isPlainObject,
  isString,
  toStringTag,
} from 'src/utils';
import type PageSpyPlugin from '../index';
import RequestItem from './request-item';

declare global {
  interface XMLHttpRequest {
    pageSpyRequestId: string;
    pageSpyRequestMethod: string;
    pageSpyRequestUrl: string;
  }
}

/* c8 ignore start */
function getURL(url: string) {
  if (url.startsWith('//')) {
    // eslint-disable-next-line no-param-reassign
    url = window.location.protocol + url;
  }
  if (url.startsWith('http')) {
    return new URL(url);
  }
  return new URL(url, window.location.href);
}
/* c8 ignore stop */

// File size is not recommended to exceed 6M,
// 10M files would result negative performance impact distinctly in local-test.
const MAX_SIZE = 1024 * 1024 * 6;
const Reason = {
  EXCEED_SIZE: 'Exceed maximum limit',
};

export default class NetworkPlugin implements PageSpyPlugin {
  name = 'NetworkPlugin';

  xhrOpen: XMLHttpRequest['open'] | null = null;

  xhrSend: XMLHttpRequest['send'] | null = null;

  xhrSetRequestHeader: XMLHttpRequest['setRequestHeader'] | null = null;

  fetch: WindowOrWorkerGlobalScope['fetch'] | null = null;

  sendBeacon: Navigator['sendBeacon'] | null = null;

  reqList: Record<string, RequestItem> = {};

  onCreated() {
    this.xhrProxy();
    this.fetchProxy();
    this.sendBeaconProxy();
  }

  xhrProxy() {
    const that = this;
    /* c8 ignore start */
    if (!window.XMLHttpRequest) {
      return;
    }
    /* c8 ignore stop */
    const { open, send, setRequestHeader } = window.XMLHttpRequest.prototype;
    this.xhrOpen = open;
    this.xhrSend = send;
    this.xhrSetRequestHeader = setRequestHeader;

    window.XMLHttpRequest.prototype.open = function (...args: any[]) {
      const XMLReq = this;
      const method = args[0];
      const url = args[1];
      const id = getRandomId();
      let timer: number | null = null;

      this.pageSpyRequestId = id;
      this.pageSpyRequestMethod = method;
      this.pageSpyRequestUrl = url;

      const onreadystatechange = this.onreadystatechange || function () {};
      const onReadyStateChange = function (...evts: any) {
        if (!that.reqList[id]) {
          that.reqList[id] = new RequestItem(id);
        }
        const req = that.reqList[id];
        req.readyState = XMLReq.readyState;

        const header = XMLReq.getAllResponseHeaders() || '';
        const headerArr = header.trim().split(/[\r\n]+/);

        switch (XMLReq.readyState) {
          case 0:
          case 1:
            req.status = XMLReq.status;
            req.statusText = 'Pending';
            if (!req.startTime) {
              req.startTime = Date.now();
            }
            break;
          // Header received
          case 2:
            req.status = XMLReq.status;
            req.statusText = 'Loading';
            req.responseHeader = {};
            headerArr.forEach((item) => {
              const parts = item.split(': ');
              const headerKey = parts.shift();
              const value = parts.join(': ');
              req.responseHeader![headerKey!] = value;
            });
            break;
          // Loading and download
          case 3:
            req.status = XMLReq.status;
            req.statusText = 'Loading';
            break;
          // Done
          case 4:
            clearInterval(timer as number);
            req.status = XMLReq.status;
            req.statusText = 'Done';
            req.endTime = Date.now();
            req.costTime = req.endTime - (req.startTime || req.endTime);
            req.response = XMLReq.response;
            break;
          /* c8 ignore start */
          default:
            clearInterval(timer as number);
            req.status = XMLReq.status;
            req.statusText = 'Unknown';
            break;
          /* c8 ignore stop */
        }

        // update response by responseType
        switch (XMLReq.responseType) {
          case '':
          case 'text':
            if (isString(XMLReq.response)) {
              try {
                req.response = JSON.parse(XMLReq.response);
              } catch (e) {
                // not a JSON string
                req.response = XMLReq.response;
              }
            } /* c8 ignore start */ else if (
              typeof XMLReq.response !== 'undefined'
            ) {
              req.response = toStringTag(XMLReq.response);
            }
            /* c8 ignore stop */
            break;
          case 'json':
            if (typeof XMLReq.response !== 'undefined') {
              req.response = JSON.stringify(XMLReq.response, null, 2);
            }
            break;
          case 'blob':
          case 'arraybuffer':
            if (XMLReq.response) {
              let blob = XMLReq.response;
              if (isArrayBuffer(blob)) {
                const contentType = req.responseHeader!['content-type'];
                blob = new Blob([blob], { type: contentType });
              }
              if (isBlob(blob)) {
                if (blob.size <= MAX_SIZE) {
                  blob2base64(blob, (data) => {
                    if (isString(data)) {
                      req.response = data;
                      that.collectRequest(XMLReq.pageSpyRequestId, req);
                    }
                  });
                } /* c8 ignore start */ else {
                  req.response = `[object ${XMLReq.responseType}]`;
                  req.responseReason = Reason.EXCEED_SIZE;
                }
                /* c8 ignore stop */
              }
            }
            break;
          /* c8 ignore start */
          case 'document':
          default:
            if (typeof XMLReq.response !== 'undefined') {
              req.response = Object.prototype.toString.call(XMLReq.response);
            }
            break;
          /* c8 ignore stop */
        }
        that.collectRequest(XMLReq.pageSpyRequestId, req);
        return onreadystatechange.apply(XMLReq, evts);
      };

      XMLReq.onreadystatechange = onReadyStateChange;

      // some 3rd-libraries will change XHR's default function
      // so we use a timer to avoid lost tracking of readyState
      let preState = -1;
      timer = window.setInterval(() => {
        // eslint-disable-next-line eqeqeq
        if (preState != XMLReq.readyState) {
          preState = XMLReq.readyState;
          onReadyStateChange.call(XMLReq);
        }
      }, 10);

      return open.apply(XMLReq, args as any);
    };

    window.XMLHttpRequest.prototype.setRequestHeader = function (key, value) {
      const req = that.reqList[this.pageSpyRequestId];
      if (req) {
        if (!req.requestHeader) {
          req.requestHeader = {};
        }
        (req.requestHeader as Record<string, string>)[key] = value;
      }
      return setRequestHeader.apply(this, [key, value]);
    };

    window.XMLHttpRequest.prototype.send = function (body) {
      const XMLReq = this;
      const {
        pageSpyRequestId = getRandomId(),
        pageSpyRequestMethod = 'GET',
        pageSpyRequestUrl = '',
      } = XMLReq;
      const req =
        that.reqList[pageSpyRequestId] || new RequestItem(pageSpyRequestId);

      const query = pageSpyRequestUrl.split('?') || [];
      req.method = pageSpyRequestMethod.toUpperCase();
      req.url = pageSpyRequestUrl;
      req.name = query.shift() || '';
      req.name = req.name.replace(/[/]*$/, '').split('/').pop() || '';
      req.requestType = 'xhr';
      req.responseType = XMLReq.responseType;
      req.withCredentials = XMLReq.withCredentials;

      if (query.length > 0) {
        req.name += `?${query}`;
        req.getData = {};
        const queryArr = query.join('?').split('&');
        queryArr.forEach((item) => {
          const [key, value] = item.split('=');
          req.getData![key] = decodeURIComponent(value);
        });
      }
      if (body && req.method === 'POST') {
        /* c8 ignore start */
        if (isString(body)) {
          try {
            req.postData = JSON.parse(body as string);
          } catch (e) {
            req.postData = body as string;
          }
        } else if (isPlainObject(body)) {
          req.postData = body as unknown as Record<string, string>;
        } else {
          req.postData = '[object Object]';
        }
        /* c8 ignore stop */
      }
      return send.apply(XMLReq, [body]);
    };
  }

  fetchProxy() {
    const that = this;
    const originFetch = window.fetch;

    /* c8 ignore next 3 */
    if (!originFetch) {
      return;
    }
    this.fetch = originFetch;
    window.fetch = function (input: RequestInfo | URL, init: RequestInit = {}) {
      const id = getRandomId();
      that.reqList[id] = new RequestItem(id);
      const req = that.reqList[id];
      let method = 'GET';
      let url: URL;
      let requestHeader: HeadersInit | null;
      let fetchResponse: Response | null;

      if (isString(input)) {
        // when `input` is a string
        method = init.method || 'GET';
        url = getURL(<string>input);
        requestHeader = init?.headers || null;
      } else {
        // when `input` is a `Request` object
        method = (<Request>input).method || 'GET';
        url = getURL((<Request>input).url);
        requestHeader = (<Request>input).headers;
      }

      const query = url.href.split('?') || [];
      req.name = query.shift() || '';
      req.name = req.name.replace(/[/]*$/, '').split('/').pop() || '';
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
          req.postData = NetworkPlugin.getFormattedBody(init?.body);
        } else {
          // when `input` is a `Request` object
          // cannot get real type of request's body, so just display "[object Object]"
          req.postData = '[object Object]';
        }
      }
      /* c8 ignore stop */

      const request = isString(input) ? url.toString() : input;

      that.collectRequest(id, req);
      return originFetch(request, init)
        .then<string | Blob, never>((res) => {
          fetchResponse = res;
          req.endTime = Date.now();
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
        .then((res) => {
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
                blob2base64(blob, (data) => {
                  if (isString(data)) {
                    req.response = data;
                    that.collectRequest(id, req);
                  }
                });
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
          that.collectRequest(id, req);
        });
    };
  }

  sendBeaconProxy() {
    const originSendBeacon = window.navigator.sendBeacon;
    /* c8 ignore next 3 */
    if (!originSendBeacon) {
      return;
    }

    const that = this;
    this.sendBeacon = originSendBeacon;
    window.navigator.sendBeacon = function (
      url: string,
      data?: BodyInit | null,
    ) {
      const id = getRandomId();
      const req = new RequestItem(id);
      that.reqList[id] = req;

      const urlObj = getURL(url);
      req.name = urlObj.href.split('/').pop() || '';
      req.method = 'POST';
      req.url = url.toString();
      req.status = 0;
      req.statusText = 'Pending';
      req.requestType = 'ping';
      req.requestHeader = { 'Content-Type': getContentType(data) };
      req.startTime = Date.now();
      req.postData = NetworkPlugin.getFormattedBody(data);
      req.response = '';

      if (urlObj.search) {
        req.getData = {};
        urlObj.searchParams.forEach((value, key) => {
          (req.getData as Record<string, string>)[key] = value;
        });
      }

      const result = originSendBeacon.call(window.navigator, url, data);
      if (result) {
        req.status = 200;
        req.statusText = 'Sent';
        req.endTime = Date.now();
        req.costTime = req.endTime - (req.startTime || req.endTime);
        req.readyState = 4;
      } /* c8 ignore start */ else {
        req.status = 500;
        req.statusText = 'Unknown';
      }
      /* c8 ignore stop */
      that.collectRequest(id, req);
      return result;
    };
  }

  collectRequest(id: string, req: RequestItem) {
    if (!this.reqList[id]) {
      this.reqList[id] = req;
    }
    const message = makeMessage(
      DEBUG_MESSAGE_TYPE.NETWORK,
      {
        ...req,
      },
      false,
    );
    socketStore.broadcastMessage(message);
  }

  static getFormattedBody(body?: BodyInit | null) {
    /* c8 ignore start */
    if (!body) {
      return null;
    }
    let ret: Record<string, string> | string = '';
    const type = getPrototypeName(body);
    switch (type) {
      case 'String':
        try {
          // try to parse as JSON
          ret = JSON.parse(<string>body);
        } catch (e) {
          // not a json, return original string
          ret = <string>body;
        }
        break;

      case 'URLSearchParams':
        ret = {};
        (body as URLSearchParams).forEach((value, key) => {
          (ret as Record<string, string>)[key] = value;
        });
        break;

      default:
        ret = `[object ${type}]`;
        break;
    }
    /* c8 ignore stop */
    return ret;
  }
}
