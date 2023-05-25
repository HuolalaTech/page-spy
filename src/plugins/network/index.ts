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

  xhrProxy: XhrProxy | null = null;

  fetchProxy: FetchProxy | null = null;

  beaconProxy: BeaconProxy | null = null;

  onCreated() {
    this.xhrProxy = new XhrProxy();
    this.fetchProxy = new FetchProxy();
    this.beaconProxy = new BeaconProxy();
  }
}
