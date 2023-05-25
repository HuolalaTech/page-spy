import { makeMessage, DEBUG_MESSAGE_TYPE } from 'src/utils/message';
import socketStore from 'src/utils/socket';
import { getPrototypeName } from 'src/utils';
import RequestItem from './request-item';

export default class NetworkProxyBase {
  reqMap: Record<string, RequestItem> = {};

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

  static getFormattedBody(body?: BodyInit | null) {
    /* c8 ignore start */
    if (!body) {
      return null;
    }
    let ret: Record<string, string> | string = '';
    const type = getPrototypeName(body);
    switch (type) {
      case 'String':
        try {
          // try to parse as JSON
          ret = JSON.parse(<string>body);
        } catch (e) {
          // not a json, return original string
          ret = <string>body;
        }
        break;

      case 'URLSearchParams':
        ret = {};
        (body as URLSearchParams).forEach((value, key) => {
          (ret as Record<string, string>)[key] = value;
        });
        break;

      default:
        ret = `[object ${type}]`;
        break;
    }
    /* c8 ignore stop */
    return ret;
  }
}
