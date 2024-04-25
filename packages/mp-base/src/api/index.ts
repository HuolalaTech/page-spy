import type { SpyMP } from '@huolala-tech/page-spy-types';
import { combineName } from 'base/src/device';
import { getMPSDK, joinQuery, promisifyMPApi } from 'mp-base/src/utils';
import { Config } from '../config';
import Device from '../device';
import { getRandomId } from 'base/src';

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
  createRoom() {
    const config = this.config.get();
    const scheme = getScheme(config.enableSSL);
    const device = combineName(Device.info);

    const query = joinQuery({
      group: config.project,
      title: config.title,
      // TODO putting all device info (or ua) in "name" is not a good practice.
      // this should be changed in next main version.
      // the backend support custom field in queries.
      name: encodeURIComponent(device),
    });

    return promisifyMPApi<{ data: TResponse<TCreateRoom> }>(getMPSDK().request)(
      {
        url: `${scheme[0]}${this.base}/api/v1/room/create?${query}`,
        method: 'POST',
      },
    ).then(
      (res) => {
        const { name, address } = res.data?.data || {};
        const roomUrl = this.getRoomUrl(address, device);
        return {
          roomUrl,
          address,
          name,
        };
      },
      (err) => {
        /* c8 ignore next */
        throw Error(`Request create room failed: ${err.message}`);
      },
    );
  }

  getRoomUrl(address: string, device: string) {
    const config = this.config.get();
    const scheme = getScheme(config.enableSSL);
    return `${scheme[1]}${this.base}/api/v1/ws/room/join?${joinQuery({
      address,
      // TODO: temp solution to separate room info and client info.
      // Must be removed in next big version.
      'room.name': device,
      'room.group': config.project,
      'room.title': config.title,
      name: `client:${getRandomId()}`,
      userId: 'Client',
      forceCreate: true,
    })}`;
  }
}
