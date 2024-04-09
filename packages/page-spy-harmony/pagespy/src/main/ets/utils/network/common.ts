import { isString, toStringTag } from '../index';
import http from '@ohos.net.http';

// File size is not recommended to exceed the MAX_SIZE,
// big size files would result negative performance impact distinctly in local-test.
export const MAX_SIZE = 1024 * 1024 * 2;
export const Reason = {
  EXCEED_SIZE: 'Exceed maximum limit',
};

// Fork XMLHttpRequest status, for usage in platforms other than browser.
export enum ReqReadyState {
  UNSENT = 0,
  OPENED = 1,
  HEADERS_RECEIVED = 2,
  LOADING = 3,
  DONE = 4,
}

export enum ResponseType {
  STRING = 'text',
  OBJECT = 'json',
  ARRAY_BUFFER = 'arraybuffer',
}

/**
 * FormData and USP are the only two types of request payload that can have the same key.
 * SO, we store the request payload with different structure:
 * - FormData / USP: [string, string][]
 * - Others: string. (Tips: the body maybe serialized json string, you can try to
 *                    deserialize it as need)
 */
export function getFormattedBody(body?: http.HttpRequestOptions['extraData']) {
  if (!body) {
    return null;
  }
  if (typeof body === 'object') {
    return Object.entries(body);
  }
  if (isString(body)) {
    return body;
  }
  return toStringTag(body);
}

export function isOkStatusCode(status: number) {
  return status >= 200 && status < 400;
}

export function toLowerKeys(obj: any) {
  const keys = Object.keys(obj);
  const lowerKeys: any = {};
  for (let i = 0; i < keys.length; i++) {
    const key = keys[i];
    lowerKeys[key.toLowerCase()] = obj[key];
  }
  return lowerKeys;
}
