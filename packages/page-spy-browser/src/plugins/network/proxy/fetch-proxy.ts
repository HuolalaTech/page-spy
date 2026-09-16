import {
  blob2base64Async,
  getRandomId,
  isHeaders,
  isObjectLike,
  isString,
  isURL,
  psLog,
  addContentTypeHeader,
  getFormattedBody,
  MAX_SIZE,
  RequestItem,
  ReqReadyState,
  Reason,
} from '@huolala-tech/page-spy-base';
import WebNetworkProxyBase from './base';

export default class FetchProxy extends WebNetworkProxyBase {
  public fetch: WindowOrWorkerGlobalScope['fetch'] | null = null;

  constructor() {
    super();
    this.initProxyHandler();
  }

  public reset() {
    if (this.fetch) {
      window.fetch = this.fetch;
    }
  }

  private async consumeEventStream(
    response: Response,
    id: string,
    req: RequestItem,
  ) {
    const reader = response.body?.getReader();
    if (!reader) return;

    const decoder = new TextDecoder();
    let pending = '';
    const publishEvents = (isFinished = false) => {
      const events = pending.split(/\r?\n\r?\n/);
      pending = isFinished ? '' : events.pop() || '';

      events.forEach((event) => {
        const data: string[] = [];
        let eventType = 'message';
        let lastEventId = '';

        event.split(/\r?\n/).forEach((line) => {
          if (line.startsWith(':')) return;

          const separator = line.indexOf(':');
          const field = separator === -1 ? line : line.slice(0, separator);
          const value =
            separator === -1 ? '' : line.slice(separator + 1).replace(/^ /, '');

          if (field === 'data') data.push(value);
          if (field === 'event') eventType = value;
          if (field === 'id') lastEventId = value;
        });

        if (eventType !== 'message' || data.length === 0) return;

        req.status = 200;
        req.statusText = 'Done';
        req.readyState = ReqReadyState.DONE;
        req.response = data.join('\n');
        req.lastEventId = lastEventId;
        req.endTime = Date.now();
        req.costTime = req.endTime - (req.startTime || req.endTime);
        this.sendRequestItem(id, req);
      });
    };

    const read = async (): Promise<void> => {
      const { done, value } = await reader.read();
      if (value) {
        pending += decoder.decode(value, { stream: !done });
      }
      if (done) {
        pending += decoder.decode();
        publishEvents(true);
        return;
      }
      publishEvents();
      await read();
    };

    await read();
  }

  public initProxyHandler() {
    const that = this;
    const originFetch = window.fetch;

    if (!originFetch) {
      return;
    }
    this.fetch = originFetch;
    window.fetch = function (input: RequestInfo | URL, init: RequestInit = {}) {
      const fetchInstance = originFetch(input, init);

      const id = getRandomId();
      that.createRequest(id);
      const req = that.getRequest(id);
      if (req) {
        let method = 'GET';
        let url: string | URL;
        let requestHeader: HeadersInit | null = null;

        if (isString(input) || isURL(input)) {
          // when `input` is a string
          method = init.method || 'GET';
          url = input;
          requestHeader = init.headers || null;
        } else {
          // when `input` is a `Request` object
          method = input.method;
          url = input.url;
          requestHeader = input.headers;
        }

        req.url = new URL(url, window.location.href).toString();
        req.method = method.toUpperCase();
        req.requestType = 'fetch';
        req.status = 0;
        req.statusText = 'Pending';
        req.startTime = Date.now();
        req.readyState = XMLHttpRequest.UNSENT;

        if (init.credentials && init.credentials !== 'omit') {
          req.withCredentials = true;
        }

        if (requestHeader) {
          if (isHeaders(requestHeader)) {
            req.requestHeader = [...requestHeader.entries()];
          } else if (isObjectLike(requestHeader)) {
            req.requestHeader = Object.entries(requestHeader).map(([k, v]) => [
              String(k),
              String(v),
            ]);
          } else {
            req.requestHeader = requestHeader.map(([k, v]) => [
              String(k),
              String(v),
            ]);
          }
        }

        if (req.method !== 'GET') {
          req.requestHeader = addContentTypeHeader(
            req.requestHeader,
            init.body,
          );
          getFormattedBody(init.body).then((res) => {
            req.requestPayload = res;
            that.sendRequestItem(id, req);
          });
        }
        that.sendRequestItem(id, req);

        let isEventStream = false;
        fetchInstance
          .then<string | Blob | undefined, never>((res) => {
            // Headers received
            req.status = res.status || 200;
            req.statusText = res.statusText || 'Done';
            req.responseHeader = [...res.headers.entries()];
            req.readyState = XMLHttpRequest.HEADERS_RECEIVED;
            that.sendRequestItem(id, req);

            const contentType = res.headers.get('content-type');
            if (contentType) {
              if (contentType.includes('text/event-stream')) {
                isEventStream = true;
                req.responseType = 'text';
                return that
                  .consumeEventStream(res.clone(), id, req)
                  .then(() => undefined);
              }

              if (contentType.includes('application/json')) {
                req.responseType = 'json';
                return res.clone().text();
              }

              if (
                contentType.includes('text/html') ||
                contentType.includes('text/plain')
              ) {
                req.responseType = 'text';
                return res.clone().text();
              }
            }
            req.responseType = 'blob';
            return res.clone().blob();
          })
          .then(async (res) => {
            if (isEventStream) return;

            switch (req.responseType) {
              case 'text':
              case 'json':
                try {
                  req.response = JSON.parse(res as string);
                } catch (e) {
                  req.response = res;
                  req.responseType = 'text';
                }
                break;
              case 'blob':
                // eslint-disable-next-line no-case-declarations
                const blob = res as Blob;
                if (blob.size <= MAX_SIZE) {
                  try {
                    req.response = await blob2base64Async(blob);
                  } /* c8 ignore start */ catch (e: unknown) {
                    req.response = await blob.text();
                    psLog.error(e instanceof Error ? e.message : String(e));
                  } /* c8 ignore stop */
                } else {
                  req.response = '[object Blob]';
                  req.responseReason = Reason.EXCEED_SIZE;
                }
                break;
              /* c8 ignore next 2 */
              default:
                break;
            }
          })
          .finally(() => {
            req.endTime = Date.now();
            req.costTime = req.endTime - (req.startTime || req.endTime);
            req.readyState = XMLHttpRequest.DONE;
            that.sendRequestItem(id, req);
          });
      } /* c8 ignore start */ else {
        psLog.warn('The request object is not found on window.fetch event');
      } /* c8 ignore stop */
      return fetchInstance;
    };
  }
}
