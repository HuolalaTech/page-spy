import { makeMessage, DEBUG_MESSAGE_TYPE } from '../message/index';
import { psLog } from '../index';
import { RequestItem } from '../request-item';
import { SocketStoreBase } from '../socket-base';
import { ReqReadyState } from './common';
import { PUBLIC_DATA } from '../message/debug-type';

type RequestStore = Record<string, RequestItem | null>;
export default class NetworkProxyBase {
  public reqMap: RequestStore = Object.create(null);

  constructor(public socketStore: SocketStoreBase) {}

  public getRequestMap() {
    return this.reqMap;
  }

  protected getRequest(id: string) {
    const req = this.reqMap[id];
    return req;
  }

  public createRequest(id: string) {
    if (!id) {
      psLog.warn('The "id" is required when init request object');
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

  public static dataProcessor?: (data: RequestItem) => boolean;

  protected sendRequestItem(id: string, req: RequestItem) {
    const processedByUser = NetworkProxyBase.dataProcessor?.(req);
    if (processedByUser === false) return;

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
    if (Number(req.readyState) === ReqReadyState.DONE) {
      this.socketStore.dispatchEvent(PUBLIC_DATA, message);
    }
    this.socketStore.broadcastMessage(
      message,
      req.readyState !== ReqReadyState.DONE,
    );
    this.deferDeleteRequest(id);
  }

  public deferDeleteRequest(id: string) {
    const req = this.getRequest(id);
    if (req && req.readyState === ReqReadyState.DONE) {
      setTimeout(() => {
        delete this.reqMap[id];
      }, 3000);
    }
  }
}
