import {
  getRandomId,
  isString,
  toStringTag,
  isArrayBuffer,
  isBlob,
} from 'src/utils';
import { blob2base64Async } from 'src/utils/blob';
import NetworkProxyBase from './base';
import RequestItem from './request-item';
import {
  MAX_SIZE,
  Reason,
  addContentTypeHeader,
  resolveUrlInfo,
} from './common';

declare global {
  interface XMLHttpRequest {
    pageSpyRequestId: string;
    pageSpyRequestMethod: string;
    pageSpyRequestUrl: string;
  }
}
class XhrProxy extends NetworkProxyBase {
  xhrOpen: XMLHttpRequest['open'] | null = null;

  xhrSend: XMLHttpRequest['send'] | null = null;

  xhrSetRequestHeader: XMLHttpRequest['setRequestHeader'] | null = null;

  constructor() {
    super();
    this.initProxyHandler();
  }

  initProxyHandler() {
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

      this.pageSpyRequestId = id;
      this.pageSpyRequestMethod = method;
      this.pageSpyRequestUrl = url;

      XMLReq.addEventListener('readystatechange', async () => {
        if (!that.reqMap[id]) {
          that.reqMap[id] = new RequestItem(id);
        }
        const req = that.reqMap[id];
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
          // Header received
          case XMLReq.HEADERS_RECEIVED:
            req.status = XMLReq.status;
            req.statusText = 'Loading';
            const header = XMLReq.getAllResponseHeaders() || '';
            const headerArr = header.trim().split(/[\r\n]+/);
            req.responseHeader = headerArr.reduce((acc, cur) => {
              const [headerKey, ...parts] = cur.split(': ');
              acc.push([headerKey, parts.join(': ')]);
              return acc;
            }, [] as [string, string][]);
            break;
          // Loading and download
          case XMLReq.LOADING:
            req.status = XMLReq.status;
            req.statusText = 'Loading';
            break;
          // Done
          case XMLReq.DONE:
            req.status = XMLReq.status;
            req.statusText = 'Done';
            req.endTime = Date.now();
            /* c8 ignore next */
            req.costTime = req.endTime - (req.startTime || req.endTime);
            const formatResult = await that.formatResponse(XMLReq);
            req.response = {
              ...req.response,
              ...formatResult,
            };
            break;
          /* c8 ignore start */
          default:
            req.status = XMLReq.status;
            req.statusText = 'Unknown';
            break;
          /* c8 ignore stop */
        }
        that.sendRequestItem(XMLReq.pageSpyRequestId, req);
      });

      return open.apply(XMLReq, args as any);
    };

    window.XMLHttpRequest.prototype.setRequestHeader = function (key, value) {
      const req = that.reqMap[this.pageSpyRequestId];
      if (req) {
        if (!req.requestHeader) {
          req.requestHeader = [];
        }
        req.requestHeader.push([key, value]);
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
      /* c8 ignore start */
      const req =
        that.reqMap[pageSpyRequestId] || new RequestItem(pageSpyRequestId);
      const urlInfo = resolveUrlInfo(pageSpyRequestUrl);
      req.url = urlInfo.url;
      req.name = urlInfo.name;
      req.getData = urlInfo.query;
      /* c8 ignore stop */
      req.method = pageSpyRequestMethod.toUpperCase();
      req.requestType = 'xhr';
      req.responseType = XMLReq.responseType;
      req.withCredentials = XMLReq.withCredentials;
      if (req.method === 'POST') {
        req.requestHeader = addContentTypeHeader(req.requestHeader, body);
        NetworkProxyBase.getFormattedBody(body).then((res) => {
          req.postData = res;
        });
      }
      return send.apply(XMLReq, [body]);
    };
  }

  // eslint-disable-next-line class-methods-use-this
  async formatResponse(XMLReq: XMLHttpRequest) {
    const result: Partial<RequestItem> = {};

    // update response by responseType
    switch (XMLReq.responseType) {
      case '':
      case 'text':
        if (isString(XMLReq.response)) {
          try {
            result.response = JSON.parse(XMLReq.response);
          } catch (e) {
            // not a JSON string
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
          result.response = JSON.stringify(XMLReq.response, null, 2);
        }
        break;
      case 'blob':
      case 'arraybuffer':
        if (XMLReq.response) {
          let blob = XMLReq.response;
          if (isArrayBuffer(blob)) {
            const contentType = XMLReq.getResponseHeader('content-type');
            if (contentType) {
              blob = new Blob([blob], { type: contentType });
            }
          }
          if (isBlob(blob)) {
            if (blob.size <= MAX_SIZE) {
              try {
                result.response = await blob2base64Async(blob);
              } catch (e: any) {
                result.response = await blob.text();
                console.error(`[PageSpy]: ${e.message}`);
              }
            } /* c8 ignore start */ else {
              result.response = `[object ${XMLReq.responseType}]`;
              result.responseReason = Reason.EXCEED_SIZE;
            }
            /* c8 ignore stop */
          }
        }
        break;
      /* c8 ignore start */
      case 'document':
      default:
        if (typeof XMLReq.response !== 'undefined') {
          result.response = Object.prototype.toString.call(XMLReq.response);
        }
        break;
      /* c8 ignore stop */
    }
    return result;
  }
}

export default XhrProxy;
