import url from '@ohos.url';
import http from '@ohos.net.http';
import { InitConfig } from '../types';
import { psLog } from '../utils';

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
    /* c8 ignore next 3 */
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

  async createRoom(): Promise<TResponse<TCreateRoom>> {
    const { project, title } = this.config;

    const scheme = this.getScheme();
    const query = joinQuery({
      // TODO
      name: 'Huawei OpenHarmony',
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
      return res.result as TResponse<TCreateRoom>;
    } catch (e) {
      throw new Error(`Request create room failed: ${e.message}}`);
    } finally {
      httpClient.destroy();
    }
  }

  getRoomUrl(args: Record<string, string | number> = {}) {
    const scheme = this.getScheme();
    return `${scheme[1]}${this.base}/api/v1/ws/room/join?${joinQuery(args)}`;
  }
}
