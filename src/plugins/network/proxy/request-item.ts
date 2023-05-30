import { SpyNetwork } from 'types';

export default class RequestItem implements SpyNetwork.RequestInfo {
  id = '';

  name: string = '';

  method: string = '';

  url: string = '';

  requestType: 'xhr' | 'fetch' | 'ping' = 'xhr';

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

  getData: [string, string][] | null = null;

  /**
   * @deprecated please using `requestPayload`
   */
  postData: [string, string][] | string | null = null;

  requestPayload: [string, string][] | string | null = null;

  withCredentials: boolean = false;

  constructor(id: string) {
    this.id = id;
  }
}
