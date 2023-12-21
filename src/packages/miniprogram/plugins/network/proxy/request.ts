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
  getFormattedBody,
  isOkStatusCode,
  MAX_SIZE,
  Reason,
  ReqReadyState,
  resolveUrlInfo,
  toLowerKeys,
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
        // TODO statusText 要不要标准化
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
          const lowerHeaders = toLowerKeys(res?.header || {});
          const contentType = lowerHeaders['content-type'];
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
              if (typeof res?.data === 'string') {
                try {
                  req.response = JSON.parse(res!.data as string);
                } catch (e) {
                  req.response = res.data;
                  req.responseType = 'text';
                }
              } else {
                req.response = res?.data;
              }
              break;
            case 'arraybuffer':
              // NOTE: 小程序 arraybuffer 没有合适的方法转为 base64，一期暂时这样。
              req.response = '[arrayBuffer]';
              // req.responseReason = Reason.EXCEED_SIZE;
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
