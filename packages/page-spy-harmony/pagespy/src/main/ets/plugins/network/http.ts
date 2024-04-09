import { getRandomId } from '../../utils';
import {
  getFormattedBody,
  ReqReadyState,
  ResponseType,
} from '../../utils/network/common';
import NetworkProxyBase from '../../utils/network/base';
import socketStore from '../../helpers/socket';
import http from '@ohos.net.http';
import { RequestItem } from '../../utils/request-item';

export default class HttpProxy extends NetworkProxyBase {
  private originCreateHttp = http.createHttp;

  public constructor() {
    super(socketStore);
    this.initProxyHandler();
  }

  private initProxyHandler() {
    Object.defineProperty(http, 'createHttp', {
      configurable: true,
      writable: true,
      value: () => {
        const originRequest = this.originCreateHttp();
        const originRequestFn = originRequest.request;
        const originOnFn = originRequest.on;

        const id = getRandomId();
        this.createRequest(id);
        const reqItem = this.getRequest(id);
        reqItem.readyState = ReqReadyState.UNSENT;

        let headersEventRegistered = false;
        const headersReceiveEvents = [
          (data: Object) => {
            reqItem.readyState = ReqReadyState.HEADERS_RECEIVED;
            reqItem.responseHeader = Object.entries(data);
            this.sendRequestItem(id, reqItem);
          },
        ];
        originRequest.on = (...args: any[]) => {
          const [type, fn] = args;
          if (type === 'headersReceive') {
            headersEventRegistered = true;
            headersReceiveEvents.push(fn);
            return originOnFn.call(originRequest, type, (data: Object) => {
              headersReceiveEvents.forEach((cb) => {
                cb(data);
              });
            });
          }
          return originOnFn.call(originRequest, ...args);
        };

        originRequest.request = (...args: any[]) => {
          if (!headersEventRegistered) {
            originOnFn.call(
              originRequest,
              'headersReceive',
              headersReceiveEvents[0],
            );
          }
          const [url, arg2, arg3] = args;
          reqItem.url = url;
          reqItem.method = arg2?.method || http.RequestMethod.GET;
          reqItem.status = 0;
          reqItem.statusText = 'Pending';
          reqItem.startTime = Date.now();
          reqItem.readyState = ReqReadyState.OPENED;
          reqItem.requestPayload = getFormattedBody(arg2?.extraData);
          reqItem.requestHeader = arg2?.header
            ? Object.entries(arg2.header)
            : null;
          this.sendRequestItem(id, reqItem);

          // Promise
          if (
            args.length === 1 ||
            (args.length === 2 && typeof arg2 === 'object')
          ) {
            const promise: Promise<http.HttpResponse> = originRequestFn.call(
              originRequest,
              ...args,
            );
            promise.then((res) => {
              this.sendRequestItem(id, this.handleResponse(reqItem, res));
            });
            return promise;
          }

          // AsyncCallback
          const options = typeof arg2 === 'object' ? arg2 : {};
          const callback =
            typeof arg2 === 'function' ? arg2 : arg3 || (() => {});
          originRequestFn.call(originRequest, url, options, (err, res) => {
            callback(err, res);
            this.sendRequestItem(id, this.handleResponse(reqItem, res));
          });
        };

        return originRequest;
      },
    });
  }

  private handleResponse(req: RequestItem, res: http.HttpResponse) {
    const reqItem = Object.assign({}, req);

    reqItem.endTime = Date.now();
    reqItem.costTime = reqItem.endTime - (reqItem.startTime || reqItem.endTime);
    reqItem.status = res.responseCode || 200;
    reqItem.statusText = 'Done';
    reqItem.responseHeader = Object.entries(res.header);
    reqItem.readyState = ReqReadyState.DONE;
    switch (res.resultType) {
      case http.HttpDataType.STRING:
        try {
          reqItem.response = JSON.parse(res.result as string);
          reqItem.responseType = ResponseType.OBJECT;
        } catch {
          reqItem.response = res.result;
          reqItem.responseType = ResponseType.STRING;
        }
        break;
      case http.HttpDataType.ARRAY_BUFFER:
        reqItem.response = '[object ArrayBuffer]';
        reqItem.responseType = ResponseType.ARRAY_BUFFER;
        break;
      default:
        break;
    }
    return reqItem;
  }

  public reset() {
    Object.defineProperty(http, 'createHttp', {
      value: this.originCreateHttp,
    });
  }
}
