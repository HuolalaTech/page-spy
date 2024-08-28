import url from '@ohos.url';
import http from '@ohos.net.http';
import { InitConfig } from '../types';
import { getRandomId } from '../utils';
import Client from '../utils/client';

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

const joinQuery = (args: Record<string, unknown>) => {
  const params = new url.URLParams();
  Object.entries(args).forEach(([k, v]) => {
    params.append(k, String(v));
  });
  return params.toString();
};

export default class Request {
  constructor(public config: Required<InitConfig>) {
    if (!config.api) {
      throw Error('The api base url cannot be empty');
    }
  }

  get base() {
    return this.config.api;
  }

  getScheme() {
    return this.config.enableSSL
      ? ['https://', 'wss://']
      : ['http://', 'ws://'];
  }

  async createRoom() {
    const { project, title } = this.config;

    const scheme = this.getScheme();
    const query = joinQuery({
      // TODO
      name: Client.getName(),
      group: project,
      title,
    });
    const httpClient = http.createHttp();

    try {
      const res = await httpClient.request(
        `${scheme[0]}${this.base}/api/v1/room/create?${query}`,
        {
          method: http.RequestMethod.POST,
          expectDataType: http.HttpDataType.OBJECT,
        },
      );
      const { name, address } =
        (res.result as TResponse<TCreateRoom>).data || {};
      const roomUrl = this.getRoomUrl(address);
      return {
        roomUrl,
        address,
        name,
      };
    } catch (e) {
      throw new Error(`Request create room failed: ${e.message}}`);
    } finally {
      httpClient.destroy();
    }
  }

  getRoomUrl(address: string) {
    const scheme = this.getScheme();
    const { useSecret, secret } = this.config;
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
