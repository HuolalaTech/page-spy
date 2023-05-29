import NetworkPlugin from 'src/plugins/network';
import startServer from '../../server/index';
import data from '../../server/data.json';
import { Reason } from 'src/plugins/network/proxy/common';

const port = 6688;
const apiPrefix = `http://localhost:${port}`;
const stopServer = startServer(port);
afterAll(stopServer);

const originFetch = window.fetch;
const sleep = (t = 100) => new Promise((r) => setTimeout(r, t));

afterEach(() => {
  jest.restoreAllMocks();
  window.fetch = originFetch;
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

    const map = fetchProxy!.reqMap;
    expect(Object.values(map).length).toBe(0);

    const bigFileUrl = `${apiPrefix}/big-file`;
    await fetch(bigFileUrl);
    const reqList = Object.values(map);
    await sleep();
    expect(reqList.length).toBe(1);
    expect(reqList[0].response).toBe('[object Blob]');
    expect(reqList[0].responseReason).toBe(Reason.EXCEED_SIZE);
  });

  it('The SDK record the request information', () => {
    const np = new NetworkPlugin();
    np.onCreated();
    const { fetchProxy } = np;
    expect(fetchProxy).not.toBe(null);
    expect(Object.keys(fetchProxy!.reqMap).length).toBe(0);

    const count = 5;
    Array.from({ length: count }).forEach((_, index) => {
      fetch(`${apiPrefix}/posts/${index}`);
    });
    expect(Object.keys(fetchProxy!.reqMap).length).toBe(count);
  });
});
