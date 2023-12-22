import { Config } from 'src/utils/config';
import { InitConfig } from 'types';
import { combineName } from 'src/utils/device';
import { getDeviceInfo, joinQuery, promisifyMPApi } from '../utils';

interface TResponse<T> {
  code: string;
  data: T;
  success: boolean;
  message: string;
}

interface TCreateRoom {
  name: string;
  address: string;
  password: string;
  group: string;
  tags: Record<string, any>;
}

const getScheme = (enableSSL: InitConfig['enableSSL']) => {
  return enableSSL ? ['https://', 'wss://'] : ['http://', 'ws://'];
};

export default class Request {
  constructor(public base: string = '') {
    /* c8 ignore next 3 */
    if (!base) {
      throw Error('The api base url cannot be empty');
    }
  }

  createRoom(): Promise<TResponse<TCreateRoom>> {
    const config = Config.get();
    const scheme = getScheme(config.enableSSL);
    const device = getDeviceInfo();
    const name = combineName(device);
    const query = joinQuery({
      name: encodeURIComponent(name),
      group: config.project,
      title: config.title,
    });

    return promisifyMPApi(wx.request)({
      url: `${scheme[0]}${this.base}/api/v1/room/create?${query}`,
      method: 'POST',
    }).then(
      (res: any) => {
        return res.data;
      },
      (err) => {
        /* c8 ignore next */
        throw Error(`Request create room failed: ${err.message}`);
      },
    ) as Promise<TResponse<TCreateRoom>>;
  }

  getRoomUrl(args: Record<string, string | number> = {}) {
    const config = Config.get();
    const scheme = getScheme(config.enableSSL);
    return `${scheme[1]}${this.base}/api/v1/ws/room/join?${joinQuery(args)}`;
  }
}
