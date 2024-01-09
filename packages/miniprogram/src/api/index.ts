import { InitConfig } from 'types/index';
import { combineName } from 'base/src/device';
import { getDeviceInfo, joinQuery, promisifyMPApi } from 'base/src';
import { Config } from '../config';

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
  return enableSSL === false ? ['http://', 'ws://'] : ['https://', 'wss://'];
};

export default class Request {
  constructor(public base: string = '') {
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
