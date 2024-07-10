import RequestProxy from 'page-spy-mp-base/src/plugins/network/proxy/request';
import { RequestItem } from 'page-spy-base/src';

type RequestStore = Record<string, RequestItem | null>;
interface RequestsInfo {
  requests: RequestStore;
  freezedRequests: RequestStore;
  size: number;
}
export const computeRequestMapInfo = (
  proxy: RequestProxy | null,
): RequestsInfo => {
  if (!proxy) {
    return {
      requests: {},
      freezedRequests: {},
      size: 0,
    };
  }
  const requestMap = proxy.getRequestMap();

  return {
    /**
     * The `requests` value is UNSTABLE!!!
     * It maybe changed at any time.
     *
     * See: {@link NetworkProxyBase#deferDeleteRequest}
     */
    requests: requestMap,
    // Because of reqMap may be changed at any time, we create a copy of it.
    //
    // NOTICE: The value simply represents the reqMap entity when printed.
    freezedRequests: JSON.parse(JSON.stringify(requestMap)),
    size: Object.keys(requestMap).length,
  };
};
