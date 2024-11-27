import type { Client } from '@huolala-tech/page-spy-base';
import { getRandomId } from '@huolala-tech/page-spy-base/dist/utils';
import { Config, InitConfig } from '../config';
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

const getScheme = (enableSSL: InitConfig['enableSSL']) => {
  return enableSSL === false ? ['http://', 'ws://'] : ['https://', 'wss://'];
};

export default class Request {
  constructor(
    public config: Config,
    public client: Client,
  ) {
    if (!config.get().api) {
      throw Error('The api base url cannot be empty');
    }
  }

  get base() {
    return this.config.get().api;
  }

  getScheme() {
    return this.config.get().enableSSL
      ? ['https://', 'wss://']
      : ['http://', 'ws://'];
  }

  createRoom() {
    const config = this.config.get();
    const scheme = getScheme(config.enableSSL);
    const name = this.client.getName();
    const query = joinQuery({
      name: encodeURIComponent(name),
      group: config.project,
      title: config.title,
    });

    return fetch(`${scheme[0]}${this.base}/api/v1/room/create?${query}`, {
      method: 'POST',
    })
      .then((res) => res.json())
      .then((res: TResponse<TCreateRoom>) => {
        // eslint-disable-next-line @typescript-eslint/no-shadow
        const { name, address } = res.data || {};
        const roomUrl = this.getRoomUrl(address);
        return {
          roomUrl,
          address,
          name,
        };
      })
      .catch((err) => {
        /* c8 ignore next */
        throw Error(`Request create room failed: ${err.message}`);
      });
  }

  getRoomUrl(address: string) {
    const scheme = this.getScheme();
    const { useSecret, secret } = this.config.get();
    return `${scheme[1]}${this.base}/api/v1/ws/room/join?${joinQuery({
      address,
      name: `client:${getRandomId()}`,
      userId: 'Client',
      forceCreate: true,
      useSecret,
      secret,
    })}`;
  }
}
