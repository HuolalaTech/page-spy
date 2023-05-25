// eslint-disable no-case-declarations
import type PageSpyPlugin from '../index';
import XhrProxy from './proxy/xhr-proxy';
import FetchProxy from './proxy/fetch-proxy';
import BeaconProxy from './proxy/beacon-proxy';

declare global {
  interface XMLHttpRequest {
    pageSpyRequestId: string;
    pageSpyRequestMethod: string;
    pageSpyRequestUrl: string;
  }
}

export default class NetworkPlugin implements PageSpyPlugin {
  name = 'NetworkPlugin';

  xhrProxy = new XhrProxy();

  fetchProxy = new FetchProxy();

  beaconProxy = new BeaconProxy();

  // eslint-disable-next-line class-methods-use-this
  onCreated() {}
}
