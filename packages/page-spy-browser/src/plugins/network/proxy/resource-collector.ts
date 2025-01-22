import { getRandomId } from '@huolala-tech/page-spy-base';
import { SpyNetwork } from '@huolala-tech/page-spy-types';
import WebNetworkProxyBase from './base';

export class ResourceCollector extends WebNetworkProxyBase {
  private observer: PerformanceObserver | null = null;

  private excluded = /(beacon|fetch|xmlhttprequest)/i;

  constructor() {
    super();
    this.initResourceHandler();
  }

  initResourceHandler() {
    const from = performance.timeOrigin || Date.now() - performance.now();
    this.observer = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      entries.forEach((e: any) => {
        const {
          name,
          initiatorType,
          fetchStart,
          responseEnd,
          duration,
          responseStatus = 0,
        } = e;
        if (this.excluded.test(initiatorType)) return;

        const id = getRandomId();
        this.createRequest(id);
        const req = this.getRequest(id)!;
        req.method = 'GET';
        req.url = name;
        req.requestType = initiatorType as SpyNetwork.RequestType;
        req.readyState = XMLHttpRequest.DONE;
        req.startTime = from + fetchStart;
        req.endTime = from + responseEnd;
        req.costTime = duration;
        req.response = '';
        req.responseType = 'resource';
        req.status = responseStatus;
        this.sendRequestItem(id, req);
      });
    });
    this.observer.observe({
      type: 'resource',
      buffered: true,
    });
  }

  reset() {
    this.observer?.disconnect();
    this.observer = null;
  }
}
