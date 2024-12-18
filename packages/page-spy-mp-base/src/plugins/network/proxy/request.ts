import {
  getRandomId,
  isPlainObject,
  psLog,
  toStringTag,
} from '@huolala-tech/page-spy-base/dist/utils';
import {
  ReqReadyState,
  toLowerKeys,
} from '@huolala-tech/page-spy-base/dist/network/common';
import MPNetworkProxyBase from './base';
import { MPNetworkAPI } from '../../../types';
import { getOriginMPSDK } from '../../../helpers/mp-api';

export default class MPWeixinRequestProxy extends MPNetworkProxyBase {
  public request: MPNetworkAPI['request'] | null = null;

  constructor() {
    super();
    this.initProxyHandler();
  }

  public reset() {
    if (this.request) {
      const mp = getOriginMPSDK();
      Object.defineProperty(mp, 'request', {
        value: this.request,
        configurable: true,
        writable: true,
        enumerable: true,
      });
    }
  }

  public initProxyHandler() {
    const that = this;
    const mp = getOriginMPSDK();
    const originRequest = mp.request;

    if (!originRequest) {
      return;
    }
    this.request = originRequest;

    Object.defineProperty(mp, 'request', {
      value(params: Parameters<MPNetworkAPI['request']>[0]) {
        const id = getRandomId();
        that.createRequest(id);
        const req = that.getRequest(id);
        if (req) {
          const method = params.method || 'GET';
          const { url } = params;
          req.requestHeader = [];

          req.url = url;
          req.method = method.toUpperCase();
          req.requestType = 'mp-request';
          req.status = 0;
          // TODO statusText 要不要标准化
          req.statusText = 'Pending';
          req.startTime = Date.now();
          req.readyState = ReqReadyState.UNSENT;

          // 小程序不会有其他格式，不用兼容
          if (isPlainObject(params.header)) {
            req.requestHeader = Object.entries(params.header).map(([k, v]) => [
              String(k),
              String(v),
            ]);
          }

          // 即使是 GET 请求，payload 也是有价值的，因为小程序会把他拼成 queryString
          // NOTE：小程序的奇葩操作： request content-type 全部为 application/json
          req.requestHeader.push(['Content-Type', 'application/json']);
          const { data } = params;
          if (data) {
            if (typeof data === 'string') {
              req.requestPayload = data;
            } else if (data instanceof ArrayBuffer) {
              req.requestPayload = '[object ArrayBuffer]';
            } else {
              try {
                req.requestPayload = JSON.stringify(data);
              } catch (e) {
                req.requestPayload = toStringTag(data);
              }
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
                req.response = '[object ArrayBuffer]';
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
        }

        /* c8 ignore next 2 */
        psLog.warn('The request object is not found on request event');
        return null;
      },
      configurable: true,
      writable: true,
      enumerable: true,
    });
  }
}
