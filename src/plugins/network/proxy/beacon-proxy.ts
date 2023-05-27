import { getRandomId } from 'src/utils';
import NetworkProxyBase from './base';
import { addContentTypeHeader, resolveUrlInfo } from './common';
import RequestItem from './request-item';

export default class BeaconProxy extends NetworkProxyBase {
  sendBeacon: Navigator['sendBeacon'] | null = null;

  constructor() {
    super();
    this.initProxyHandler();
  }

  initProxyHandler() {
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
      that.reqMap[id] = req;

      const urlInfo = resolveUrlInfo(url);
      req.url = urlInfo.url;
      req.name = urlInfo.name;
      req.getData = urlInfo.query;
      req.method = 'POST';
      req.status = 0;
      req.statusText = 'Pending';
      req.requestType = 'ping';
      req.requestHeader = addContentTypeHeader(req.requestHeader, data);
      req.startTime = Date.now();
      NetworkProxyBase.getFormattedBody(data).then((res) => {
        req.postData = res;
      });
      req.response = '';

      const result = originSendBeacon.call(window.navigator, url, data);
      if (result) {
        req.status = 200;
        req.statusText = 'Sent';
        req.endTime = Date.now();
        /* c8 ignore next */
        req.costTime = req.endTime - (req.startTime || req.endTime);
        req.readyState = 4;
      } /* c8 ignore start */ else {
        req.status = 500;
        req.statusText = 'Unknown';
      }
      /* c8 ignore stop */
      that.sendRequestItem(id, req);
      return result;
    };
  }
}
