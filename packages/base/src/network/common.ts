import type { SpyNetwork } from '@huolala-tech/page-spy-types';
import {
  isBlob,
  isBrowser,
  isDocument,
  isFile,
  isFormData,
  isString,
  isTypedArray,
  isURLSearchParams,
  toStringTag,
} from '../index';

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

export const BINARY_FILE_VARIANT = '(file)';
export function formatEntries(data: IterableIterator<[string, unknown]>) {
  const result: [string, string][] = [];
  let processor = data.next();
  while (!processor.done) {
    const [key, value] = processor.value;
    let variant: string;
    if (isFile(value)) {
      variant = BINARY_FILE_VARIANT;
    } else {
      variant = String(value);
    }
    result.push([key, variant]);
    processor = data.next();
  }
  return result;
}

// parse url params without URLSearchParams
function parseUrlParams(url: string): [string, string][] {
  const reg = /[?&]([^=#]+)=([^&#]*)/g;
  const result: [string, string][] = [];
  let match;

  // eslint-disable-next-line no-cond-assign
  while ((match = reg.exec(url)) !== null) {
    const key = decodeURIComponent(match[1]);
    const value = decodeURIComponent(match[2]);
    result.push([key, value]);
  }

  return result;
}

// TODO: 这部分逻辑可以移到调试端去做？因为收集端可能不在浏览器环境
export function resolveUrlInfo(target: URL | string, base?: string | URL) {
  try {
    let url: string;
    let query: [string, string][];

    if (isBrowser()) {
      const { searchParams, href } = new URL(target, base);
      url = href;
      query = [...searchParams.entries()];
    } else {
      url = target.toString();
      query = parseUrlParams(url);
    }
    // https://exp.com => "exp.com/"
    // https://exp.com/ => "exp.com/"
    // https://exp.com/devtools => "devtools"
    // https://exp.com/devtools/ => "devtools/"
    // https://exp.com/devtools?version=Mac/10.15.7 => "devtools?version=Mac/10.15.7"
    // https://exp.com/devtools/?version=Mac/10.15.7 => "devtools/?version=Mac/10.15.7"
    const name = url.replace(/^.*?([^/]+)(\/)*(\?.*?)?$/, '$1$2$3') || '';

    return {
      url,
      name,
      query,
    };
  } /* c8 ignore start */ catch (e) {
    return {
      url: 'Unknown',
      name: 'Unknown',
      query: null,
    };
  } /* c8 ignore stop */
}

export function getContentType(data: Document | RequestInit['body']) {
  if (!data) return null;
  if (isFormData(data)) {
    return 'multipart/form-data';
  }
  if (isURLSearchParams(data)) {
    return 'application/x-www-form-urlencoded;charset=UTF-8';
  }
  if (isDocument(data)) {
    return 'application/xml';
  }
  if (isBlob(data)) {
    return data.type;
  }
  return 'text/plain;charset=UTF-8';
}

const CONTENT_TYPE_HEADER = 'Content-Type';
export function addContentTypeHeader(
  headers: SpyNetwork.RequestInfo['requestHeader'],
  body?: Document | BodyInit | null,
) {
  if (!body) return headers;

  const bodyContentType = getContentType(body);
  if (!bodyContentType) return headers;

  const headerTuple = [CONTENT_TYPE_HEADER, bodyContentType] as [
    string,
    string,
  ];
  if (!headers) {
    return [headerTuple];
  }

  for (let i = 0; i < headers.length; i++) {
    const [key] = headers[i];
    if (key.toUpperCase() === CONTENT_TYPE_HEADER.toUpperCase()) {
      return headers;
    }
  }
  return [...headers, headerTuple];
}

/**
 * FormData and USP are the only two types of request payload that can have the same key.
 * SO, we store the request payload with different structure:
 * - FormData / USP: [string, string][]
 * - Others: string. (Tips: the body maybe serialized json string, you can try to
 *                    deserialize it as need)
 */
export async function getFormattedBody(body?: Document | BodyInit | null) {
  if (!body) {
    return null;
  }
  if (isURLSearchParams(body) || isFormData(body)) {
    return formatEntries(body.entries());
  }
  if (isBlob(body)) {
    return '[object Blob]';
    // try {
    //   const text = await body.text();
    //   return text;
    // } catch (e) {
    //   return '[object Blob]';
    // }
  }
  if (isTypedArray(body)) {
    return '[object TypedArray]';
  }
  if (isDocument(body)) {
    const text = new XMLSerializer().serializeToString(body);
    return text;
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
