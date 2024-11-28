import {
  isBlob,
  isFormData,
  isString,
  isTypedArray,
  toStringTag,
} from '@huolala-tech/page-spy-base/dist/utils';
import { formatEntries } from '@huolala-tech/page-spy-base/dist/network/common';
import { SpyNetwork } from '@huolala-tech/page-spy-types';

export async function getFormattedBody(body?: Document | BodyInit | null) {
  if (!body) {
    return null;
  }
  if (isFormData(body)) {
    return formatEntries(body.entries());
  }
  if (isBlob(body)) {
    return '[object Blob]';
  }
  if (isTypedArray(body)) {
    return '[object TypedArray]';
  }
  if (isString(body)) {
    return body;
  }
  return toStringTag(body);
}

export function getContentType(data: Document | RequestInit['body']) {
  if (!data) return null;
  if (isFormData(data)) {
    return 'multipart/form-data';
  }
  if (isBlob(data)) {
    return data.type;
  }
  return 'text/plain;charset=UTF-8';
}

const CONTENT_TYPE_HEADER = 'Content-Type';
export function addContentTypeHeader(
  headers: SpyNetwork.RequestInfo['requestHeader'],
  body?: BodyInit | null,
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
