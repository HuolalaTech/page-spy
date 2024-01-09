// @ts-nocheck

import socket from 'src/packages/web/helpers/socket';
import NetworkProxyBase from 'src/utils/network/network-proxy-base';
import RequestItem from 'src/utils/request-item';

describe('Network Proxy Base Exceptions', () => {
  it('Test `createRequest`', () => {
    const base = new NetworkProxyBase(socket);
    expect(base.createRequest()).toBe(false);

    const id = 1;
    const item = new RequestItem();
    base.setRequest(id, item);

    expect(base.createRequest(id)).toBe(false);

    const newID = 2;
    expect(base.createRequest(2)).toBe(true);
  });

  it('Test `setRequest`', () => {
    const base = new NetworkProxyBase(socket);

    expect(base.setRequest()).toBe(false);

    const id = 1;
    const item = new RequestItem();
    expect(base.setRequest(id, item)).toBe(true);
  });
});
