import { RequestItem } from '@huolala-tech/page-spy-base/dist/request-item';
import {
  blob2base64Async,
  toStringTag,
  isArrayBuffer,
  isBlob,
  getObjectKeys,
  getRandomId,
  isString,
  psLog,
} from '@huolala-tech/page-spy-base/dist/utils';
import {
  Reason,
  MAX_SIZE,
} from '@huolala-tech/page-spy-base/dist/network/common';
import RNNetworkProxyBase from './base';
import { addContentTypeHeader, getFormattedBody } from '../common';

/**
 * React native use whatwg-fetch to polyfill fetch API based on xhr, so it's
 * no need to proxy fetch since we already proxy xhr.
 * But there is one problem: whatwg-fetch will set responseType of xhr to 'blob',
 * which will make our response logic confused.
 *
 * The solution is: we proxy the fetch function but only add 'page-spy-is-fetch' request header,
 * and still handle all proxy logic in xhr, so the xhr knows the responseType === 'blob' is not
 * set by user.
 */
export const IS_FETCH_HEADER = 'page-spy-is-fetch';

declare global {
  interface XMLHttpRequest {
    pageSpyRequestId: string;
    pageSpyRequestMethod: string;
    pageSpyRequestUrl: string;
    // is from upper fetch, then the xhr will not handle proxy.
    isFetch?: boolean;
  }
}
class XhrProxy extends RNNetworkProxyBase {
  public xhrOpen: XMLHttpRequest['open'] | null = null;

  public xhrSend: XMLHttpRequest['send'] | null = null;

  public xhrSetRequestHeader: XMLHttpRequest['setRequestHeader'] | null = null;

  public constructor() {
    super();
    this.initProxyHandler();
  }

  public initProxyHandler() {
    const that = this;
    const { open, send, setRequestHeader } = XMLHttpRequest.prototype;
    this.xhrOpen = open;
    this.xhrSend = send;
    this.xhrSetRequestHeader = setRequestHeader;

    XMLHttpRequest.prototype.open = function (...args: any[]) {
      const XMLReq = this;
      const method = args[0];
      const url = args[1];
      const id = getRandomId();
      that.createRequest(id);

      this.pageSpyRequestId = id;
      this.pageSpyRequestMethod = method;
      this.pageSpyRequestUrl = url;

      return open.apply(XMLReq, args as any);
    };

    XMLHttpRequest.prototype.setRequestHeader = function (key, value) {
      // this header indicate that the request is from upper fetch.
      // no need to handle.
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

    XMLHttpRequest.prototype.send = function (body) {
      const XMLReq = this;
      const {
        pageSpyRequestId,
        pageSpyRequestMethod = 'GET',
        pageSpyRequestUrl = '',
      } = XMLReq;
      const req = that.getRequest(pageSpyRequestId);

      /** This listener is moved to 'send' instead of 'open', because an xhr initiated by fetch
       * could be ignored by proxy after 'open' is called, but 'readystatechange' may be
       * triggered before 'send', and 'sendRequestItem' may be called that send an empty request
       * item waiting for response which will never be handled, and result in an empty line in debugger.
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
        req.url = new URL(pageSpyRequestUrl).toString();
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

  public reset() {
    if (this.xhrOpen) {
      XMLHttpRequest.prototype.open = this.xhrOpen;
    }
    if (this.xhrSend) {
      XMLHttpRequest.prototype.send = this.xhrSend;
    }
    if (this.xhrSetRequestHeader) {
      XMLHttpRequest.prototype.setRequestHeader = this.xhrSetRequestHeader;
    }
  }

  // eslint-disable-next-line class-methods-use-this
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

    // How to format the response is depend on XMLReq.responseType.
    // The behavior is different with format fetch's response, which
    // is depend on response.headers.get('content-type')
    switch (type) {
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
