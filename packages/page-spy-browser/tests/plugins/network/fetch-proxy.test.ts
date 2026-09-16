import NetworkPlugin from 'page-spy-browser/src/plugins/network';
import data from '../../server/data.json';
import { atom, MAX_SIZE, Reason } from 'page-spy-base/src';
import { computeRequestMapInfo } from './util';
import { OnInitParams, SpyMessage } from 'packages/page-spy-types';
import { Config, InitConfig } from 'page-spy-browser/src/config';
import socket from 'page-spy-browser/src/helpers/socket';

const initParams = {
  config: new Config().mergeConfig({}),
  socketStore: socket,
  atom,
} as OnInitParams<InitConfig>;
const apiPrefix = 'https://example.test';

const originFetch = window.fetch;

interface MockResponse {
  body: BodyInit;
  contentType: string;
}

const mockResponses: Record<string, MockResponse> = {
  '/posts': { body: JSON.stringify(data), contentType: 'application/json' },
  '/plain-text': { body: 'Hello PageSpy', contentType: 'text/plain' },
  '/html': {
    body: '<div id="app"><h3>Hello PageSpy</h3></div>',
    contentType: 'text/html',
  },
  '/json': {
    body: JSON.stringify({ name: 'PageSpy' }),
    contentType: 'application/json',
  },
  '/blob': {
    body: new Blob(['image'], { type: 'image/png' }),
    contentType: 'image/png',
  },
  '/big-file': {
    body: new Blob(['x'.repeat(MAX_SIZE + 1)], { type: 'image/jpeg' }),
    contentType: 'image/jpeg',
  },
};

const createResponse = (input: RequestInfo | URL) => {
  const url = new URL(
    input instanceof Request ? input.url : input.toString(),
    window.location.href,
  );
  const response = mockResponses[url.pathname] || {
    body: '',
    contentType: 'text/plain',
  };

  return new Response(response.body, {
    status: 200,
    headers: { 'content-type': response.contentType },
  });
};

const fetchMock = jest.fn<
  Promise<Response>,
  [input: RequestInfo | URL, init?: RequestInit]
>((input) => Promise.resolve(createResponse(input)));

beforeEach(() => {
  fetchMock.mockClear();
  window.fetch = fetchMock;
});

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
    new NetworkPlugin().onInit(initParams);
    expect(window.fetch).toBe(undefined);
  });
  it('Wrap fetch request', () => {
    expect(window.fetch).toBe(fetchMock);

    new NetworkPlugin().onInit(initParams);
    expect(window.fetch).not.toBe(fetchMock);
  });

  it('The origin fetch will be called and get response', async () => {
    new NetworkPlugin().onInit(initParams);

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
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(json1).toEqual(data);

    // fetch(new Request())
    const res2 = await fetch(new Request(url));
    const json2 = await res2.json();
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(json2).toEqual(data);
  });

  it('Request different type response', async () => {
    // text/plain
    new NetworkPlugin().onInit(initParams);
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

  it('Records messages from an event stream response', async () => {
    const np = new NetworkPlugin();
    np.onInit(initParams);
    const { fetchProxy } = np;
    const messages: string[] = [];
    const captureEventStreamMessage = (message: SpyMessage.MessageItem) => {
      if (
        message.type === 'network' &&
        message.data.requestType === 'eventsource' &&
        typeof message.data.response === 'string'
      ) {
        messages.push(message.data.response);
      }
    };
    socket.addListener('public-data', captureEventStreamMessage);
    const chunks = [
      new TextEncoder().encode(
        'id: first\ndata: hello\n\nid: second\ndata: Page',
      ),
      new TextEncoder().encode('Spy\n\n'),
    ];
    const response = new Response('', {
      status: 200,
      headers: { 'content-type': 'text/event-stream' },
    });
    const reader = {
      read: jest.fn(async () => {
        const value = chunks.shift();
        return value ? { done: false, value } : { done: true, value };
      }),
    };
    Object.defineProperty(response, 'body', {
      value: { getReader: () => reader },
    });
    jest.spyOn(response, 'clone').mockReturnValue(response);
    fetchMock.mockResolvedValueOnce(response);

    try {
      await fetch(`${apiPrefix}/events`);
      await new Promise((resolve) => setTimeout(resolve, 0));
    } finally {
      socket.removeListener('public-data', captureEventStreamMessage);
    }

    const { freezedRequests, size } = computeRequestMapInfo(fetchProxy);
    expect(size).toBe(1);
    expect(messages).toEqual(['hello', 'PageSpy']);
    expect(Object.values(freezedRequests)[0]).toMatchObject({
      requestType: 'eventsource',
      responseType: 'text',
      response: 'PageSpy',
      lastEventId: 'second',
      readyState: XMLHttpRequest.DONE,
    });
  });

  it('Big response entity will not be converted to base64 by PageSpy', async () => {
    const np = new NetworkPlugin();
    np.onInit(initParams);
    const { fetchProxy } = np;
    expect(computeRequestMapInfo(fetchProxy).size).toBe(0);

    const bigFileUrl = `${apiPrefix}/big-file`;
    await fetch(bigFileUrl);
    await new Promise((resolve) => setTimeout(resolve, 0));

    const { freezedRequests, size } = computeRequestMapInfo(fetchProxy);
    expect(size).toBe(1);
    const current = Object.values(freezedRequests);
    expect(current[0]?.response).toBe('[object Blob]');
    expect(current[0]?.responseReason).toBe(Reason.EXCEED_SIZE);
  });

  it('The SDK record the request information', () => {
    const np = new NetworkPlugin();
    np.onInit(initParams);
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
    jest.useFakeTimers();
    const np = new NetworkPlugin();
    np.onInit(initParams);
    const { fetchProxy } = np;
    expect(fetchProxy).not.toBe(null);
    expect(computeRequestMapInfo(fetchProxy).size).toBe(0);

    try {
      await fetch(`${apiPrefix}/json`);
      await jest.advanceTimersByTimeAsync(0);
      expect(computeRequestMapInfo(fetchProxy).size).toBe(1);

      jest.advanceTimersByTime(3000);
      expect(computeRequestMapInfo(fetchProxy).size).toBe(0);
    } finally {
      jest.useRealTimers();
    }
  });
});
