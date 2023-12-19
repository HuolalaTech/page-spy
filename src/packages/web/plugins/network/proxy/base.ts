import socketStore from 'web/helpers/socket';
import NetworkProxyBase from 'src/utils/network/network-proxy-base';

export default class WebNetworkProxyBase extends NetworkProxyBase {
  constructor() {
    super(socketStore);
  }
}
