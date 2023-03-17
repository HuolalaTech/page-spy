import { combineName, parseUserAgent } from 'src/utils/ua';

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

export default class Request {
  constructor(public base: string = '') {
    if (!base) {
      throw Error('The api base url cannot be empty');
    }
  }

  createRoom(project: string): Promise<TResponse<TCreateRoom>> {
    const device = parseUserAgent();
    const name = combineName(device);
    return fetch(
      `https://${this.base}/room/create?name=${name}&group=${project}`,
      {
        method: 'GET',
      },
    )
      .then((res) => res.json())
      .catch((err) => {
        throw Error(`Connection failed: ${err.message}`);
      });
  }

  getRoomUrl(args: Record<string, string | number> = {}) {
    const params = Object.keys(args).reduce((acc, cur, index, arr) => {
      const val = args[cur];
      if (val == null) return acc;
      let kv = `${cur}=${val}`;
      if (index < arr.length - 1) {
        kv += '&';
      }
      return acc + kv;
    }, '');
    return `wss://${this.base}/ws/room/join?${params}`;
  }
}
