import { makeMessage } from '../message/index';
import { psLog } from '../index';
import RequestItem from '../request-item';
import { SocketStoreBase } from '../socket-base';
import { ReqReadyState } from './common';

type RequestStore = Record<string, RequestItem | null>;
export default class NetworkProxyBase {
  private reqMap: RequestStore = Object.create(null);

  constructor(private socketStore: SocketStoreBase) {}

  public getRequestMap() {
    return this.reqMap;
  }

  protected getRequest(id: string) {
    const req = this.reqMap[id];
    return req;
  }

  public createRequest(id: string) {
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

  public setRequest(id: string, req: RequestItem) {
    if (!id || !req) return false;
    this.reqMap[id] = req;
    return true;
  }

  protected sendRequestItem(id: string, req: RequestItem) {
    if (!this.reqMap[id]) {
      this.reqMap[id] = req;
    }

    const message = makeMessage(
      'network',
      {
        ...req,
      },
      false,
    );
    if (Number(req.readyState) === ReqReadyState.DONE) {
      this.socketStore.dispatchEvent('public-data', message);
    }
    this.socketStore.broadcastMessage(
      message,
      req.readyState !== ReqReadyState.DONE,
    );
    this.deferDeleteRequest(id);
  }

  private deferDeleteRequest(id: string) {
    const req = this.getRequest(id);
    if (req && req.readyState === ReqReadyState.DONE) {
      setTimeout(() => {
        delete this.reqMap[id];
      }, 3000);
    }
  }
}
