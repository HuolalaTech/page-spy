import { SpyNetwork } from '../types';
import { ReqReadyState, ResponseType } from './network/common';

export class RequestItem implements SpyNetwork.RequestInfo {
  id = '';

  method: string = 'GET';

  url: string = '';

  requestType = 'oh-http';

  requestHeader: [string, string][] | null = null;

  status: number | string = 0;

  statusText: string = '';

  readyState: ReqReadyState = 0;

  response: any;

  responseReason: string | null = null; // error response reason

  responseType: ResponseType = ResponseType.STRING;

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

  constructor(id: string) {
    this.id = id;
  }
}
