import { psLog } from 'src/utils';
import { combineName, parseUserAgent } from 'src/utils/ua';
import { InitConfig } from 'types';

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
    psLog.error(
      'Failed to resolve the protocol and fallback to [http://, ws://]',
    );
  }
  return ['http://', 'ws://'];
})();

const joinQuery = (args: Record<string, unknown>) => {
  const params = new URLSearchParams();
  Object.entries(args).forEach(([k, v]) => {
    params.append(k, String(v));
  });
  return params.toString();
};

export default class Request {
  constructor(public base: string = '') {
    /* c8 ignore next 3 */
    if (!base) {
      throw Error('The api base url cannot be empty');
    }
  }

  createRoom(config: Required<InitConfig>): Promise<TResponse<TCreateRoom>> {
    const device = parseUserAgent();
    const name = combineName(device);
    const query = joinQuery({
      name,
      group: config.project,
      title: config.title,
    });
    return fetch(
      `${resolvedProtocol[0]}${this.base}/api/v1/room/create?${query}`,
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
    return `${resolvedProtocol[1]}${this.base}/api/v1/ws/room/join?${joinQuery(
      args,
    )}`;
  }
}
