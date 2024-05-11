import type { SpyMP } from '@huolala-tech/page-spy-types';
import { combineName } from 'base/src/device';
import { Config } from '../config';
import Device from '../device';
import { joinQuery } from '../utils';

interface TResponse<T> {
  code: string;
  data: T;
  success: boolean;
  message: string;
}

interface TCreateRoom {
  name: string; // TODO this `name` is used for browser and os info, should be reconsidered.
  address: string;
  password: string;
  group: string;
  tags: Record<string, any>;
}

const getScheme = (enableSSL: SpyMP.MPInitConfig['enableSSL']) => {
  return enableSSL === false ? ['http://', 'ws://'] : ['https://', 'wss://'];
};

export default class Request {
  constructor(public config: Config) {
    if (!config.get().api) {
      throw Error('The api base url cannot be empty');
    }
  }

  get base() {
    return this.config.get().api;
  }

  createRoom(): Promise<TResponse<TCreateRoom>> {
    const config = this.config.get();
    const scheme = getScheme(config.enableSSL);
    const device = Device.info;
    const name = combineName(device);
    const query = joinQuery({
      name: encodeURIComponent(name),
      group: config.project,
      title: config.title,
    });

    return fetch(`${scheme[0]}${this.base}/api/v1/room/create?${query}`, {
      method: 'POST',
    })
      .then((res) => res.json())
      .catch((err) => {
        /* c8 ignore next */
        throw Error(`Request create room failed: ${err.message}`);
      });
  }

  getRoomUrl(args: Record<string, string | number> = {}) {
    const config = this.config.get();
    const scheme = getScheme(config.enableSSL);
    return `${scheme[1]}${this.base}/api/v1/ws/room/join?${joinQuery(args)}`;
  }
}
