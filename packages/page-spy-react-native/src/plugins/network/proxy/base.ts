import NetworkProxyBase from 'base/src/network/base';
import socketStore from 'page-spy-react-native/src/helpers/socket';
export default class RNNetworkProxyBase extends NetworkProxyBase {
  constructor() {
    super(socketStore);
  }
}
