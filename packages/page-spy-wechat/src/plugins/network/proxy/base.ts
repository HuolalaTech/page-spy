import socketStore from 'page-spy-wechat/src/helpers/socket';
import NetworkProxyBase from 'base/src/network/base';

export default class MPNetworkProxyBase extends NetworkProxyBase {
  constructor() {
    super(socketStore);
  }
}
