import socketStore from 'page-spy-browser/src/helpers/socket';
import NetworkProxyBase from 'base/src/network/base';

export default class WebNetworkProxyBase extends NetworkProxyBase {
  constructor() {
    super(socketStore);
  }
}
