export interface RequestInfo {
  id: string;
  method: string;
  url: string;
  requestType:
    | 'xhr'
    | 'fetch'
    | 'ping'
    | 'mp-request'
    | 'mp-upload'
    | 'eventsource';
  /**
   * `Content-Type` is a special value in requestHeader.
   * The property isn't required for `GET` request,
   * but there are some cases when the request method is`POST`
   * and the property value will depend on body's type:
   * 1. <Empty>: the property is unnecessary
   * 2. FormData: "multipart/form-data"
   * 3. URLSearchParams: "application/x-www-form-urlencoded;charset=UTF-8"
   * 4. Blob: depended on the entity type, there are "text/plain", "image/png" etc.
   * 5. String: "text/plain"
   * 6. Document: "application/xml"
   * 7. Others: "text/plain"
   */
  requestHeader: [string, string][] | null;
  status: number | string;
  statusText: string;
  readyState: XMLHttpRequest['readyState'];
  response: any;
  responseReason: string | null;
  responseType: XMLHttpRequest['responseType'];
  responseHeader: [string, string][] | null;
  startTime: number;
  endTime: number;
  costTime: number;
  /**
   * @deprecated please using `requestPayload`
   */
  postData: [string, string][] | string | null;
  /**
   * Base on the 'requestHeader' field mentioned above, FormData and USP
   * are the only two types of request payload that can have the same key.
   * SO, we store the postData with different structure:
   * - FormData / USP: [string, string][]
   * - Others: string. (Tips: the body maybe serialized json string, you can try to deserialize it as need)
   */
  requestPayload: [string, string][] | string | null;
  withCredentials: boolean;
}
