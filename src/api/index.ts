import { psLog } from 'src/utils';
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

const resolvedProtocol = (() => {
  try {
    const { protocol } = new URL(document.currentScript?.getAttribute('src')!);
    if (protocol.startsWith('https')) {
      return ['https://', 'wss://'];
    }
  } catch (e) {
    console.error(e);
    psLog.error(
      'Failed to resolve the protocol and fallback to [http://, ws://]',
    );
  }
  return ['http://', 'ws://'];
})();

export default class Request {
  constructor(public base: string = '') {
    /* c8 ignore next 3 */
    if (!base) {
      throw Error('The api base url cannot be empty');
    }
  }

  createRoom(project: string): Promise<TResponse<TCreateRoom>> {
    const device = parseUserAgent();
    const name = combineName(device);
    return fetch(
      `${resolvedProtocol[0]}${this.base}/api/v1/room/create?name=${name}&group=${project}`,
      {
        method: 'POST',
      },
    )
      .then((res) => res.json())
      .catch((err) => {
        /* c8 ignore next */
        throw Error(`Request create room failed: ${err.message}`);
      });
  }

  getRoomUrl(args: Record<string, string | number> = {}) {
    const params = Object.keys(args).reduce((acc, cur, index, arr) => {
      const val = args[cur];
      /* c8 ignore next */
      if (val == null) return acc;
      let kv = `${cur}=${val}`;
      if (index < arr.length - 1) {
        kv += '&';
      }
      return acc + kv;
    }, '');
    return `${resolvedProtocol[1]}${this.base}/api/v1/ws/room/join?${params}`;
  }
}
