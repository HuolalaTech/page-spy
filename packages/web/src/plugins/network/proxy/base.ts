import socketStore from 'web/src/helpers/socket';
import NetworkProxyBase from 'base/src/network/base';

export default class WebNetworkProxyBase extends NetworkProxyBase {
  constructor() {
    super(socketStore);
  }
}
