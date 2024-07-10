import BeaconProxy from 'page-spy-browser/src/plugins/network/proxy/beacon-proxy';
import FetchProxy from 'page-spy-browser/src/plugins/network/proxy/fetch-proxy';
import { RequestItem } from 'page-spy-base/src';
import XhrProxy from 'page-spy-browser/src/plugins/network/proxy/xhr-proxy';

type RequestStore = Record<string, RequestItem | null>;
interface RequestsInfo {
  requests: RequestStore;
  freezedRequests: RequestStore;
  size: number;
}
export const computeRequestMapInfo = (
  proxy: XhrProxy | FetchProxy | BeaconProxy | null,
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
