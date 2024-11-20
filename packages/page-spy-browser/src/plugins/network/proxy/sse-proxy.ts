import {
  getRandomId,
  RequestItem,
  ReqReadyState,
} from '@huolala-tech/page-spy-base';
import WebNetworkProxyBase from './base';

const OriginEventSource = window.EventSource;

/**
 * Support data format:
 *  - Standard: `event: message\ndata: <response-data>\n\n...`
 *  - No event field: `data: <response-data>\n\n`
 * Unsupport data format:
 *  - event's value is not "message": `event: ping\ndata: <response-data>\n\n`
 *
 * The reason the data format is not supported is that the "ping" (or others) event type
 * does not dispatch the "message" event listener, and we can't get what the value
 * of the event actually is.
 */
export default class SSEProxy extends WebNetworkProxyBase {
  constructor() {
    super();
    this.initProxyHandler();
  }

  public initProxyHandler() {
    if (!window.EventSource) {
      return;
    }

    const _sseProxy = this;
    window.EventSource = class EventSourceProxy {
      constructor(url: string | URL, eventSourceInitDict?: EventSourceInit) {
        const id = getRandomId();
        const req = new RequestItem(id);
        req.url = new URL(url, window.location.href).toString();
        req.method = 'GET';
        req.requestType = 'eventsource';
        req.requestHeader = [
          ['Accept', 'text/event-stream'],
          ['Cache-Control', 'no-cache'],
        ];
        req.readyState = ReqReadyState.UNSENT;
        req.withCredentials = Boolean(eventSourceInitDict?.withCredentials);
        req.responseHeader = [['Content-Type', 'text/event-stream']];
        req.responseType = 'text';
        req.startTime = Date.now();

        const es = new OriginEventSource(url, eventSourceInitDict);
        es.addEventListener('open', () => {
          req.readyState = ReqReadyState.OPENED;
          req.endTime = Date.now();
          req.costTime = req.endTime - req.startTime;
          _sseProxy.sendRequestItem(id, req);
        });
        es.addEventListener('message', ({ data, lastEventId }) => {
          req.status = 200;
          req.statusText = 'Done';
          req.readyState = ReqReadyState.DONE;
          req.response = data;
          req.lastEventId = lastEventId;
          req.endTime = Date.now();
          req.costTime = req.endTime - req.startTime;
          _sseProxy.sendRequestItem(id, req);
        });
        es.addEventListener('error', () => {
          req.status = 400;
          req.readyState = ReqReadyState.DONE;
          req.endTime = Date.now();
          req.costTime = req.endTime - req.startTime;
          _sseProxy.sendRequestItem(id, req);
        });

        // eslint-disable-next-line no-constructor-return
        return es;

        // const _esProxy = this;
        // return new Proxy(_esProxy, {
        //   get(target, prop) {
        //     if (prop in target) {
        //       return target[prop as keyof EventSourceProxy];
        //     }
        //     const value = target.es[prop as keyof EventSource];
        //     return typeof value === 'function'
        //       ? value.bind(_esProxy.es)
        //       : value;
        //   },
        // });
      }
    } as any;
  }

  public reset() {
    window.EventSource = OriginEventSource;
  }
}
