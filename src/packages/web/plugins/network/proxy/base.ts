import { makeMessage, DEBUG_MESSAGE_TYPE } from 'src/utils/message';
import socketStore from 'web/helpers/socket';
import { psLog } from 'src/utils';
import RequestItem from 'src/utils/request-item';

type RequestStore = Record<string, RequestItem | null>;
export default class NetworkProxyBase {
  private reqMap: RequestStore = Object.create(null);

  public getRequestMap() {
    return this.reqMap;
  }

  protected getRequest(id: string) {
    const req = this.reqMap[id];
    return req;
  }

  protected createRequest(id: string) {
    if (!id) {
      psLog.error('The "id" is required when init request object');
      return false;
    }
    if (this.reqMap[id]) {
      psLog.warn(
        'The request object has been in store, disallow duplicate create',
      );
      return false;
    }
    this.reqMap[id] = new RequestItem(id);
    return true;
  }

  protected setRequest(id: string, req: RequestItem) {
    if (!id || !req) return false;
    this.reqMap[id] = req;
    return true;
  }

  protected sendRequestItem(id: string, req: RequestItem) {
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
    socketStore.broadcastMessage(
      message,
      req.readyState !== XMLHttpRequest.DONE,
    );
    this.deferDeleteRequest(id);
  }

  private deferDeleteRequest(id: string) {
    const req = this.getRequest(id);
    if (req && req.readyState === 4) {
      setTimeout(() => {
        delete this.reqMap[id];
      }, 3000);
    }
  }
}
