import socketStore from 'miniprogram/helpers/socket';
import NetworkProxyBase from 'src/utils/network/network-proxy-base';

export default class MPNetworkProxyBase extends NetworkProxyBase {
  constructor() {
    super(socketStore);
  }
}
