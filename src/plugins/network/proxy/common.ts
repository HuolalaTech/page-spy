// File size is not recommended to exceed 6M,

import {
  isBlob,
  isDocument,
  isFile,
  isFormData,
  isURLSearchParams,
} from 'src/utils';
import { SpyNetwork } from 'types';

// 10M files would result negative performance impact distinctly in local-test.
export const MAX_SIZE = 1024 * 1024 * 6;
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
    const { href, pathname, search, searchParams, hostname } = new URL(
      target,
      window.location.href,
    );
    const url = href;
    const query = [...searchParams.entries()];
    // https://exp.com => "exp.com"
    // https://exp.com/ => "exp.com"
    // https://exp.com/devtools => "devtools"
    // https://exp.com/devtools/ => "devtools"
    // https://exp.com/devtools?version=Mac/10.15.7 => "devtools?version=Mac/10.15.7"
    // https://exp.com/devtools/?version=Mac/10.15.7 => "devtools?version=Mac/10.15.7"
    let name = pathname.replace(/[/]*$/, '').split('/').pop() || '';
    name += search;
    if (name === '') {
      name = hostname;
    }

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
