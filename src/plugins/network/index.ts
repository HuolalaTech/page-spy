// eslint-disable no-case-declarations
import type PageSpyPlugin from '../index';
import XhrProxy from './proxy/xhr-proxy';
import FetchProxy from './proxy/fetch-proxy';
import BeaconProxy from './proxy/beacon-proxy';

export default class NetworkPlugin implements PageSpyPlugin {
  public name = 'NetworkPlugin';

  public xhrProxy: XhrProxy | null = null;

  public fetchProxy: FetchProxy | null = null;

  public beaconProxy: BeaconProxy | null = null;

  public onCreated() {
    this.xhrProxy = new XhrProxy();
    this.fetchProxy = new FetchProxy();
    this.beaconProxy = new BeaconProxy();
  }
}
