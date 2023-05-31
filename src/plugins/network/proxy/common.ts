import {
  isBlob,
  isDocument,
  isFile,
  isFormData,
  isString,
  isTypedArray,
  isURLSearchParams,
  toStringTag,
} from 'src/utils';
import { SpyNetwork } from 'types';

// File size is not recommended to exceed the MAX_SIZE,
// big size files would result negative performance impact distinctly in local-test.
export const MAX_SIZE = 1024 * 1024 * 2;
export const Reason = {
  EXCEED_SIZE: 'Exceed maximum limit',
};

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

export function resolveUrlInfo(target: URL | string) {
  try {
    const { href, searchParams } = new URL(target, window.location.href);
    const url = href;
    const query = [...searchParams.entries()];
    // https://exp.com => "exp.com/"
    // https://exp.com/ => "exp.com/"
    // https://exp.com/devtools => "devtools"
    // https://exp.com/devtools/ => "devtools/"
    // https://exp.com/devtools?version=Mac/10.15.7 => "devtools?version=Mac/10.15.7"
    // https://exp.com/devtools/?version=Mac/10.15.7 => "devtools/?version=Mac/10.15.7"
    const name = href.replace(/^.*?([^/]+)(\/)*(\?.*?)?$/, '$1$2$3') || '';

    return {
      url,
      name,
      query,
    };
  } catch (e) {
    console.error(e);
    return {
      url: 'Unknown',
      name: 'Unknown',
      query: null,
    };
  }
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
