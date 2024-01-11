import { psLog } from 'base/src';
import { Config } from 'page-spy-browser/src/config';
import { combineName, parseUserAgent } from 'base/src/device';

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
  const params = new URLSearchParams();
  Object.entries(args).forEach(([k, v]) => {
    params.append(k, String(v));
  });
  return params.toString();
};

export default class Request {
  constructor(public config: Config) {
    /* c8 ignore next 3 */
    if (!config.get().api) {
      throw Error('The api base url cannot be empty');
    }
  }

  get base() {
    return this.config.get().api;
  }

  parseSchemeWithScript() {
    try {
      const { protocol } = new URL(this.config.scriptLink);
      if (protocol.startsWith('https')) {
        return ['https://', 'wss://'];
      }
    } catch (e) {
      psLog.error(
        'Failed to resolve the protocol and fallback to [http://, ws://]',
      );
    }
    return ['http://', 'ws://'];
  }

  getScheme() {
    const { enableSSL } = this.config.get();
    if (typeof enableSSL !== 'boolean') {
      return this.parseSchemeWithScript();
    }
    return enableSSL ? ['https://', 'wss://'] : ['http://', 'ws://'];
  }

  createRoom(): Promise<TResponse<TCreateRoom>> {
    const config = this.config.get();
    const scheme = this.getScheme();
    const device = parseUserAgent();
    const name = combineName(device);
    const query = joinQuery({
      name,
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
    const scheme = this.getScheme();
    return `${scheme[1]}${this.base}/api/v1/ws/room/join?${joinQuery(args)}`;
  }
}
