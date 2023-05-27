import { makeMessage, DEBUG_MESSAGE_TYPE } from 'src/utils/message';
import socketStore from 'src/utils/socket';
import {
  isBlob,
  isDocument,
  isFormData,
  isString,
  isURLSearchParams,
  toStringTag,
} from 'src/utils';
import RequestItem from './request-item';
import { formatEntries } from './common';

export default class NetworkProxyBase {
  reqMap: Record<string, RequestItem> = Object.create(null);

  sendRequestItem(id: string, req: RequestItem) {
    if (!this.reqMap[id]) {
      this.reqMap[id] = req;
    }
    const message = makeMessage(
      DEBUG_MESSAGE_TYPE.NETWORK,
      {
        ...req,
      },
      false,
    );
    socketStore.broadcastMessage(message);
  }

  /**
   * FormData and USP are the only two types of request payload that can have the same key.
   * SO, we store the postData with different structure:
   * - FormData / USP: [string, string][]
   * - Others: string. (Tips: the body maybe serialized json string, you can try to
   *                    deserialize it as need)
   */
  static async getFormattedBody(body?: Document | BodyInit | null) {
    if (!body) {
      return null;
    }
    if (isURLSearchParams(body) || isFormData(body)) {
      return formatEntries(body.entries());
    }
    if (isBlob(body)) {
      try {
        const text = await body.text();
        return text;
      } catch (e) {
        return '[object Blob]';
      }
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
}
