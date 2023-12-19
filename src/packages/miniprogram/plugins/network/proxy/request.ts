import {
  getRandomId,
  isHeaders,
  isObjectLike,
  isString,
  isURL,
  psLog,
  toStringTag,
} from 'src/utils';
import {
  addContentTypeHeader,
  getFormattedBody,
  isOkStatusCode,
  MAX_SIZE,
  Reason,
  ReqReadyState,
  resolveUrlInfo,
} from 'src/utils/network/common';
import MPNetworkProxyBase from './base';

type SuccessResType = {
  data: string | object | ArrayBuffer;
  statusCode: number;
  header: Record<string, string>;
  cookies?: string[];
};

type ErrorType = {
  errMsg: string;
  errno: number; // mini program error code
};

export default class MPWeixinRequestProxy extends MPNetworkProxyBase {
  private request: typeof wx.request | null = null;

  constructor() {
    super();
    this.initProxyHandler();
  }

  private initProxyHandler() {
    const that = this;
    const originRequest = wx.request;

    if (!originRequest) {
      return;
    }
    this.request = originRequest;
    wx.request = function (params: Parameters<typeof wx.request>[0]) {
      const id = getRandomId();
      that.createRequest(id);
      const req = that.getRequest(id);
      if (req) {
        const method = params.method || 'GET';
        const url: string | URL = params.url;
        const requestHeader: HeadersInit | null = params.header || null;

        const urlInfo = resolveUrlInfo(url);
        req.url = urlInfo.url;
        req.name = urlInfo.name;
        req.getData = urlInfo.query;

        req.method = method.toUpperCase();
        req.requestType = 'wx-request';
        req.status = 0;
        req.statusText = 'Pending';
        req.startTime = Date.now();
        req.readyState = ReqReadyState.UNSENT;

        if (isObjectLike(requestHeader)) {
          req.requestHeader = Object.entries(requestHeader);
        } else {
          req.requestHeader = requestHeader;
        }

        if (req.method !== 'GET') {
          // NOTE：小程序的奇葩操作： request content-type 全部为 application/json
          req.requestHeader = [['Content-Type', 'application/json']];
          // 小程序应该没有这么麻烦
          // req.requestHeader = addContentTypeHeader(
          //   req.requestHeader,
          //   params.data,
          // );

          if (typeof params.data === 'string') {
            req.requestPayload = params.data;
          } else if (typeof params.data === 'object') {
            if (params.data instanceof ArrayBuffer) {
              req.requestPayload = '[object ArrayBuffer]';
            } else {
              req.requestPayload = JSON.stringify(params.data);
            }
          } else {
            req.requestPayload = toStringTag(params.data);
          }
        }
        that.sendRequestItem(id, req);

        const originOnSuccess = params.success;
        const originOnFailed = params.fail;
        const originOnComplete = params.complete;

        const commonEnd = () => {
          req.endTime = Date.now();
          req.costTime = req.endTime - (req.startTime || req.endTime);
        };

        params.success = function (res) {
          commonEnd();
          req.status = res?.statusCode || 200;
          req.statusText = 'Done';
          req.responseHeader = [...Object.entries(res?.header || {})];
          req.readyState = ReqReadyState.HEADERS_RECEIVED;
          that.sendRequestItem(id, req);

          // Loading ~ Done
          if (!isOkStatusCode(res!.statusCode)) return '';
          const contentType = res?.header?.['content-type'];
          if (contentType) {
            if (contentType.includes('application/json')) {
              req.responseType = 'json';
            }

            if (
              contentType.includes('text/html') ||
              contentType.includes('text/plain')
            ) {
              req.responseType = 'text';
            }
          }
          if (!req.responseType) {
            req.responseType = 'arraybuffer';
          }

          switch (req.responseType) {
            case 'json':
            case 'text':
              try {
                req.response = JSON.parse(res!.data as string);
              } catch (e) {
                req.response = res;
                req.responseType = 'text';
              }
              break;
            case 'arraybuffer': // TODO
              // eslint-disable-next-line no-case-declarations
              const ab = res?.data as ArrayBuffer;
              // if (ab.byteLength <= MAX_SIZE) {
              //   const buffer = Buffer.from(ab)
              //   buffer.toString('base64')
              //   let a: ArrayBuffer

              //   try {
              //     req.response = await blob2base64Async(blob);
              //   } catch (e: any) {
              //     req.response = await blob.text();
              //     psLog.error(e.message);
              //   }
              // } else {
              // }
              req.response = '[arrayBuffer]';
              req.responseReason = Reason.EXCEED_SIZE;
              break;
            default:
              break;
          }
          originOnSuccess?.(res);
        };

        params.fail = function (err) {
          commonEnd();
          originOnFailed?.(err);
        };

        params.complete = function (res: any) {
          req.readyState = ReqReadyState.DONE;
          that.sendRequestItem(id, req);
          originOnComplete?.(res);
        };

        const requestInstance = originRequest(params);
        return requestInstance;
      } else {
        psLog.warn('The request object is not found on window.fetch event');
      }
    };
  }
}
