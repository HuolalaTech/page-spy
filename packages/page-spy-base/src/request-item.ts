import { SpyNetwork } from '@huolala-tech/page-spy-types';

export class RequestItem implements SpyNetwork.RequestInfo {
  id = '';

  method: string = '';

  url: string = '';

  requestType:
    | 'xhr'
    | 'fetch'
    | 'ping'
    | 'mp-request'
    | 'mp-upload'
    | 'eventsource' = 'xhr';

  requestHeader: [string, string][] | null = null;

  status: number | string = 0;

  statusText: string = '';

  readyState: XMLHttpRequest['readyState'] = 0;

  response: any;

  responseReason: string | null = null; // error response reason

  responseType: XMLHttpRequest['responseType'] = '';

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
