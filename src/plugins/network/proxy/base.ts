import { makeMessage, DEBUG_MESSAGE_TYPE } from 'src/utils/message';
import socketStore from 'src/utils/socket';
import RequestItem from './request-item';

type RequestStore = Record<string, RequestItem>;
interface RequestsInfo {
  requests: RequestStore;
  freezedRequests: RequestStore;
  size: number;
}
export default class NetworkProxyBase {
  private reqMap: RequestStore = Object.create(null);

  get requestInfo(): RequestsInfo {
    return {
      /**
       * The `requests` value is UNSTABLE!!!
       * It maybe changed at any time.
       *
       * See: {@link NetworkProxyBase#deferDeleteRequest}
       */
      requests: this.reqMap,
      // Because of reqMap may be changed at any time, we create a copy of it.
      //
      // NOTICE: The value simply represents the reqMap entity when printed.
      freezedRequests: JSON.parse(JSON.stringify(this.reqMap)),
      size: Object.keys(this.reqMap).length,
    };
  }

  getRequest(id: string) {
    let req = this.reqMap[id];
    if (!req) {
      req = new RequestItem(id);
      this.setRequest(id, req);
    }
    return req;
  }

  setRequest(id: string, req: RequestItem) {
    if (!id || !req) return false;
    this.reqMap[id] = req;
    return true;
  }

  deferDeleteRequest(id: string) {
    const req = this.getRequest(id);
    if (req && req.readyState === 4) {
      setTimeout(() => {
        delete this.reqMap[id];
      }, 3000);
    }
  }

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
    this.deferDeleteRequest(id);
  }
}
