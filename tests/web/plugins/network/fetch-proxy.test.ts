import NetworkPlugin from 'web/plugins/network';
import startServer from '../../server/index';
import data from '../../server/data.json';
import { Reason } from 'web/plugins/network/proxy/common';
import { computeRequestMapInfo } from './util';

const port = 6688;
const apiPrefix = `http://localhost:${port}`;
const stopServer = startServer(port);
afterAll(stopServer);

const originFetch = window.fetch;
const sleep = (t = 100) => new Promise((r) => setTimeout(r, t));

afterEach(() => {
  jest.restoreAllMocks();
  window.fetch = originFetch;
  NetworkPlugin.hasInitd = false;
});

describe('window.fetch proxy', () => {
  it('Do nothing if not exist window.fetch', () => {
    Object.defineProperty(window, 'fetch', {
      value: undefined,
      writable: true,
    });
    new NetworkPlugin().onCreated();
    expect(window.fetch).toBe(undefined);
  });
  it('Wrap fetch request', () => {
    const fetchSpy = jest.spyOn(window, 'fetch');
    expect(window.fetch).toBe(fetchSpy);

    new NetworkPlugin().onCreated();
    expect(window.fetch).not.toBe(fetchSpy);
  });

  it('The origin fetch will be called and get response', async () => {
    const spyFetch = jest.spyOn(window, 'fetch');
    new NetworkPlugin().onCreated();

    // fetch(url, init)
    const url = `${apiPrefix}/posts`;
    const res1 = await fetch(url, {
      method: 'GET',
      headers: {
        'X-Name': 'PageSpy',
      },
      credentials: 'include',
    });
    const json1 = await res1.json();
    expect(spyFetch).toBeCalledTimes(1);
    expect(json1).toEqual(data);

    // fetch(new Request())
    const res2 = await fetch(new Request(url));
    const json2 = await res2.json();
    expect(spyFetch).toBeCalledTimes(2);
    expect(json2).toEqual(data);
  });

  it('Request different type response', async () => {
    // text/plain
    new NetworkPlugin().onCreated();
    const textUrl = `${apiPrefix}/plain-text`;
    const res1 = await (await fetch(textUrl)).clone().text();
    expect(res1).toEqual(expect.stringContaining('Hello PageSpy'));

    // blob
    const blobUrl = `${apiPrefix}/blob`;
    const res2 = await fetch(blobUrl);
    expect(res2.status).toBe(200);

    // text/html
    const htmlUrl = `${apiPrefix}/html`;
    const res3 = await (await fetch(htmlUrl)).clone().text();
    const doc = new DOMParser().parseFromString(res3, 'text/html');
    const title = doc.querySelector('#app');
    expect(title).toBeInstanceOf(HTMLDivElement);

    // application/json
    const jsonUrl = `${apiPrefix}/json`;
    const res4 = await (await fetch(jsonUrl)).clone().json();
    expect(res4).toEqual({
      name: 'PageSpy',
    });
  });

  it('Big response entity will not be converted to base64 by PageSpy', async () => {
    const np = new NetworkPlugin();
    np.onCreated();
    const { fetchProxy } = np;
    expect(computeRequestMapInfo(fetchProxy).size).toBe(0);

    const bigFileUrl = `${apiPrefix}/big-file`;
    await fetch(bigFileUrl);
    await sleep();

    const { freezedRequests, size } = computeRequestMapInfo(fetchProxy);
    expect(size).toBe(1);
    const current = Object.values(freezedRequests);
    expect(current[0]?.response).toBe('[object Blob]');
    expect(current[0]?.responseReason).toBe(Reason.EXCEED_SIZE);
  });

  it('The SDK record the request information', () => {
    const np = new NetworkPlugin();
    np.onCreated();
    const { fetchProxy } = np;
    expect(fetchProxy).not.toBe(null);
    expect(computeRequestMapInfo(fetchProxy).size).toBe(0);

    const count = 5;
    Array.from({ length: count }).forEach((_, index) => {
      fetch(`${apiPrefix}/posts/${index}`);
    });
    expect(computeRequestMapInfo(fetchProxy).size).toBe(count);
  });

  it('The cached request items will be freed when no longer needed', async () => {
    const np = new NetworkPlugin();
    np.onCreated();
    const { fetchProxy } = np;
    expect(fetchProxy).not.toBe(null);
    expect(computeRequestMapInfo(fetchProxy).size).toBe(0);

    const res = await fetch(`${apiPrefix}/json`);
    expect(computeRequestMapInfo(fetchProxy).size).toBe(1);

    /**
     * The `whatwg-fetch` relies on the setTimeout, the value wouldn't be resolved
     * if we use `jest.useFakeTimers()`. So here we use the real timer.
     *
     * See: {@link https://github.com/jestjs/jest/issues/11103}
     */
    await sleep(3500);

    // The previous request item now be freed after 3s.
    expect(computeRequestMapInfo(fetchProxy).size).toBe(0);
  });
});
