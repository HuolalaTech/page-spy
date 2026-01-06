import { SpyNetwork } from '@huolala-tech/page-spy-types';

export class RequestItem implements SpyNetwork.RequestInfo {
  id = '';

  method: string = '';

  url: string = '';

  requestType: SpyNetwork.RequestType = 'xhr';

  requestHeader: [string, string][] | null = null;

  status: number | string = 0;

  statusText: string = '';

  readyState: XMLHttpRequest['readyState'] = 0;

  // See: https://github.com/HuolalaTech/page-spy-web/issues/390
  response: any = '__PLACEHOLDER_RESPONSE_DEFINED_BY_PAGE_SPY__';

  responseReason: string | null = null; // error response reason

  responseType: SpyNetwork.ResponseType = '';

  responseHeader: [string, string][] | null = null;

  startTime: number = 0;

  endTime: number = 0;

  costTime: number = 0;

  /**
   * @deprecated please using `requestPayload`
   */
  postData: [string, string][] | string | null = null;

  requestPayload: [string, string][] | string | null = null;

  withCredentials: boolean = false;

  // For EventSource
  lastEventId: string = '';

  constructor(id: string) {
    this.id = id;
  }
}
