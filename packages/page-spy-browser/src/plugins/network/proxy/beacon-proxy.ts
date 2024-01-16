import { getRandomId, psLog } from 'base/src';
import {
  addContentTypeHeader,
  getFormattedBody,
  resolveUrlInfo,
} from 'base/src/network/common';
import WebNetworkProxyBase from './base';

export default class BeaconProxy extends WebNetworkProxyBase {
  private sendBeacon: Navigator['sendBeacon'] | null = null;

  public constructor() {
    super();
    this.initProxyHandler();
  }

  reset() {
    if (this.sendBeacon) {
      window.navigator.sendBeacon = this.sendBeacon;
    }
  }

  private initProxyHandler() {
    const originSendBeacon = window.navigator.sendBeacon;
    if (!originSendBeacon) {
      return;
    }

    const that = this;
    this.sendBeacon = originSendBeacon;
    window.navigator.sendBeacon = function (
      url: string,
      data?: BodyInit | null,
    ) {
      const result = originSendBeacon.call(window.navigator, url, data);

      const id = getRandomId();
      that.createRequest(id);
      const req = that.getRequest(id);
      if (req) {
        const urlInfo = resolveUrlInfo(url, window.location.href);
        req.url = urlInfo.url;
        req.name = urlInfo.name;
        req.getData = urlInfo.query;
        req.method = 'POST';
        req.status = 0;
        req.statusText = 'Pending';
        req.requestType = 'ping';
        req.requestHeader = addContentTypeHeader(req.requestHeader, data);
        req.startTime = Date.now();
        getFormattedBody(data).then((res) => {
          req.requestPayload = res;
          that.sendRequestItem(id, req);
        });
        req.response = '';

        if (result) {
          req.status = 200;
          req.statusText = 'Sent';
          req.endTime = Date.now();
          req.costTime = req.endTime - (req.startTime || req.endTime);
        } else {
          req.status = 500;
          req.statusText = 'Unknown';
        }
        req.readyState = XMLHttpRequest.DONE;
        that.sendRequestItem(id, req);
      } /* c8 ignore start */ else {
        psLog.warn('The request object is not on navigator.sendBeacon event');
      } /* c8 ignore stop */
      return result;
    };
  }
}
