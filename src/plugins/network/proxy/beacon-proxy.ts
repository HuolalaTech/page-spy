import { getRandomId, getContentType } from 'src/utils';
import NetworkProxyBase from './base';
import { getURL } from './common';
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

      const urlObj = getURL(url);
      /* c8 ignore next */
      req.name = urlObj.href.split('/').pop() || '';
      req.method = 'POST';
      req.url = url.toString();
      req.status = 0;
      req.statusText = 'Pending';
      req.requestType = 'ping';
      req.requestHeader = { 'Content-Type': getContentType(data) };
      req.startTime = Date.now();
      req.postData = NetworkProxyBase.getFormattedBody(data);
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
