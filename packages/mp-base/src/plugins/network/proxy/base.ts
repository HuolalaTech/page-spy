import socketStore from 'mp-base/src/helpers/socket';
import NetworkProxyBase from 'base/src/network/base';

export default class MPNetworkProxyBase extends NetworkProxyBase {
  constructor() {
    super(socketStore);
  }
}
