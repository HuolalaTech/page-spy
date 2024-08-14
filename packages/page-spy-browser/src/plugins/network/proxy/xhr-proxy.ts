import {
  getRandomId,
  isString,
  toStringTag,
  isArrayBuffer,
  isBlob,
  getObjectKeys,
  psLog,
  blob2base64Async,
  MAX_SIZE,
  Reason,
  addContentTypeHeader,
  getFormattedBody,
  RequestItem,
} from '@huolala-tech/page-spy-base';
import WebNetworkProxyBase from './base';

declare global {
  interface XMLHttpRequest {
    pageSpyRequestId: string;
    pageSpyRequestMethod: string;
    pageSpyRequestUrl: string;
  }
}
class XhrProxy extends WebNetworkProxyBase {
  public xhrOpen: XMLHttpRequest['open'] | null = null;

  public xhrSend: XMLHttpRequest['send'] | null = null;

  public xhrSetRequestHeader: XMLHttpRequest['setRequestHeader'] | null = null;

  public constructor() {
    super();
    this.initProxyHandler();
  }

  public initProxyHandler() {
    const that = this;
    if (!window.XMLHttpRequest) {
      return;
    }
    const { open, send, setRequestHeader } = window.XMLHttpRequest.prototype;
    this.xhrOpen = open;
    this.xhrSend = send;
    this.xhrSetRequestHeader = setRequestHeader;

    window.XMLHttpRequest.prototype.open = function (...args: any[]) {
      const XMLReq = this;
      const method = args[0];
      const url = args[1];
      const id = getRandomId();
      that.createRequest(id);
      const req = that.getRequest(id);
      if (req) {
        req.url = new URL(url, window.location.href).toString();
        req.method = method.toUpperCase();
        req.requestType = 'xhr';
      }

      this.pageSpyRequestId = id;
      this.pageSpyRequestMethod = method;
      this.pageSpyRequestUrl = url;

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
            // Header received
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
              req.costTime = req.endTime - (req.startTime || req.endTime);
              const formatResult = await that.formatResponse(XMLReq);
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
        } /* c8 ignore start */ else {
          psLog.warn(
            "The request object is not found on XMLHttpRequest's readystatechange event",
          );
        }
        /* c8 ignore stop */
      });

      return open.apply(XMLReq, args as any);
    };

    window.XMLHttpRequest.prototype.setRequestHeader = function (key, value) {
      const req = that.getRequest(this.pageSpyRequestId);
      if (req) {
        if (!req.requestHeader) {
          req.requestHeader = [];
        }
        req.requestHeader.push([String(key), String(value)]);
      } /* c8 ignore start */ else {
        psLog.warn(
          "The request object is not found on XMLHttpRequest's setRequestHeader event",
        );
      } /* c8 ignore stop */
      return setRequestHeader.apply(this, [key, value]);
    };

    window.XMLHttpRequest.prototype.send = function (body) {
      const XMLReq = this;
      const { pageSpyRequestId } = XMLReq;
      const req = that.getRequest(pageSpyRequestId);
      if (req) {
        req.responseType = XMLReq.responseType;
        req.withCredentials = XMLReq.withCredentials;
        if (req.method !== 'GET') {
          req.requestHeader = addContentTypeHeader(req.requestHeader, body);
          getFormattedBody(body).then((res) => {
            req.requestPayload = res;
            that.sendRequestItem(XMLReq.pageSpyRequestId, req);
          });
        }
      } /* c8 ignore start */ else {
        psLog.warn(
          "The request object is not found on XMLHttpRequest's send event",
        );
      } /* c8 ignore stop */
      return send.apply(XMLReq, [body]);
    };
  }

  public reset() {
    if (this.xhrOpen) {
      window.XMLHttpRequest.prototype.open = this.xhrOpen;
    }
    if (this.xhrSend) {
      window.XMLHttpRequest.prototype.send = this.xhrSend;
    }
    if (this.xhrSetRequestHeader) {
      window.XMLHttpRequest.prototype.setRequestHeader =
        this.xhrSetRequestHeader;
    }
  }

  // eslint-disable-next-line class-methods-use-this
  public async formatResponse(XMLReq: XMLHttpRequest) {
    const result: {
      response: RequestItem['response'];
      responseReason: RequestItem['responseReason'];
    } = {
      response: '',
      responseReason: null,
    } as const;

    // How to format the response is depend on XMLReq.responseType.
    // The behavior is different with format fetch's response, which
    // is depend on response.headers.get('content-type')
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
          result.response = XMLReq.response;
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
              } /* c8 ignore start */ catch (e: any) {
                result.response = await blob.text();
                psLog.error(e.message);
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
