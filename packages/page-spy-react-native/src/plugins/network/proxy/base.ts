import { NetworkProxyBase } from '@huolala-tech/page-spy-base';
import socketStore from '../../../helpers/socket';

export default class RNNetworkProxyBase extends NetworkProxyBase {
  constructor() {
    super(socketStore);
  }
}
