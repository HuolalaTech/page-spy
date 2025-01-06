import type { SpyMP } from '@huolala-tech/page-spy-types';
import { getRandomId } from '@huolala-tech/page-spy-base/dist/utils';
import type { Client } from '@huolala-tech/page-spy-base/dist/client';

import { joinQuery, promisifyMPApi } from '../utils';
import { Config } from '../config';
import { getMPSDK } from '../helpers/mp-api';

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

  createRoom() {
    const { enableSSL, project, title, useSecret, secret } = this.config.get();
    const scheme = getScheme(enableSSL);
    const device = this.client.getName();

    const query = joinQuery({
      group: project,
      title,
      // TODO putting all device info (or ua) in "name" is not a good practice.
      // this should be changed in next main version.
      // the backend support custom field in queries.
      name: encodeURIComponent(device),
    });

    return promisifyMPApi(getMPSDK().request<TResponse<TCreateRoom>>)({
      url: `${scheme[0]}${this.base}/api/v1/room/create?${query}`,
      method: 'POST',
      // uniapp building android native need this option.
      sslVerify: enableSSL !== false,
      data: JSON.stringify({
        useSecret,
        secret,
      }),
    }).then(
      (res) => {
        const { name, address } = res.data?.data || {};
        const roomUrl = this.getRoomUrl(address);
        return {
          roomUrl,
          address,
          name,
        };
      },
      (err) => {
        /* c8 ignore next */
        throw Error(`Request create room failed: ${err.message || err}`);
      },
    );
  }

  getRoomUrl(address: string) {
    const config = this.config.get();
    const scheme = getScheme(config.enableSSL);
    return `${scheme[1]}${this.base}/api/v1/ws/room/join?${joinQuery({
      address,
      name: `client:${getRandomId()}`,
      userId: 'Client',
      forceCreate: true,
      useSecret: config.useSecret,
      secret: config.secret,
    })}`;
  }
}
