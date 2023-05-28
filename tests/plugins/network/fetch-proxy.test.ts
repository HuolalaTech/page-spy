import NetworkPlugin from 'src/plugins/network';
import startServer from '../../server/index';
import data from '../../server/data.json';

const stopServer = startServer();
afterAll(stopServer);

const originFetch = window.fetch;

afterEach(() => {
  jest.restoreAllMocks();
  window.fetch = originFetch;
});

describe('window.fetch proxy', () => {
  it('Wrap fetch request', () => {
    const fetchSpy = jest.spyOn(window, 'fetch');
    expect(window.fetch).toBe(fetchSpy);

    new NetworkPlugin().onCreated();
    expect(window.fetch).not.toBe(fetchSpy);
  });

  it('The origin fetch will be called and get response', async () => {
    const spyFetch = jest.spyOn(window, 'fetch');
    const api = 'http://localhost:6677/posts';
    const res = await fetch(api, {
      method: 'GET',
      credentials: 'include',
    });
    const json = await res.json();
    expect(spyFetch).toBeCalledTimes(1);
    expect(json).toEqual(data);
  });

  it('The SDK record the request information', () => {
    const np = new NetworkPlugin();
    np.onCreated();
    const { fetchProxy } = np;
    expect(fetchProxy).not.toBe(null);
    expect(Object.keys(fetchProxy!.reqMap).length).toBe(0);

    const count = 5;
    Array.from({ length: count }).forEach((_, index) => {
      fetch(`http://localhost:6677/posts/${index}`);
    });
    expect(Object.keys(fetchProxy!.reqMap).length).toBe(count);
  });
});
