import NetworkPlugin from 'page-spy-browser/src/plugins/network';
import data from '../../server/data.json';
import { atom, MAX_SIZE, Reason } from 'page-spy-base/src';
import { computeRequestMapInfo } from './util';
import { OnInitParams } from 'packages/page-spy-types';
import { Config, InitConfig } from 'page-spy-browser/src/config';
import socket from 'page-spy-browser/src/helpers/socket';

const initParams = {
  config: new Config().mergeConfig({}),
  socketStore: socket,
  atom,
} as OnInitParams<InitConfig>;
const apiPrefix = 'https://example.test';

const waitForTasks = () => new Promise((resolve) => setTimeout(resolve, 0));

const textResponses: Record<string, string> = {
  '/posts': JSON.stringify(data),
  '/plain-text': 'Hello PageSpy',
  '/html': '<div id="app"><h3>Hello PageSpy</h3></div>',
  '/json': JSON.stringify({ name: 'PageSpy' }),
};

const createResponse = (xhr: XMLHttpRequest) => {
  const path = new URL(xhr.pageSpyRequestUrl, window.location.href).pathname;
  const body = textResponses[path] || JSON.stringify({ name: 'PageSpy' });

  if (path === '/blob') {
    if (xhr.responseType === 'arraybuffer') {
      return new Uint8Array([1, 2, 3]).buffer;
    }
    return new Blob(['image'], { type: 'image/png' });
  }
  if (path === '/big-file') {
    return new Blob(['x'.repeat(MAX_SIZE + 1)], { type: 'image/jpeg' });
  }
  if (xhr.responseType === 'json') {
    return JSON.parse(body);
  }
  if (xhr.responseType === 'document') {
    return new DOMParser().parseFromString(body, 'text/html');
  }
  return body;
};

const mockXhrResponse = (xhr: XMLHttpRequest) => {
  const response = createResponse(xhr);
  Object.defineProperties(xhr, {
    status: { configurable: true, value: 200 },
    statusText: { configurable: true, value: 'OK' },
    response: { configurable: true, value: response },
    responseText: {
      configurable: true,
      value:
        typeof response === 'string'
          ? response
          : textResponses[
              new URL(xhr.pageSpyRequestUrl, window.location.href).pathname
            ] || '',
    },
  });
  [
    XMLHttpRequest.HEADERS_RECEIVED,
    XMLHttpRequest.LOADING,
    XMLHttpRequest.DONE,
  ].forEach((readyState) => {
    Object.defineProperty(xhr, 'readyState', {
      configurable: true,
      value: readyState,
    });
    xhr.dispatchEvent(new Event('readystatechange'));
  });
  xhr.dispatchEvent(new Event('load'));
};

let spyOpen: jest.SpyInstance;
let spySetHeader: jest.SpyInstance;
let spySend: jest.SpyInstance;

const {
  open: originOpen,
  setRequestHeader: originSetRequestHeader,
  send: originSend,
} = window.XMLHttpRequest.prototype;
beforeEach(() => {
  spyOpen = jest.spyOn(XMLHttpRequest.prototype, 'open');
  spySetHeader = jest.spyOn(XMLHttpRequest.prototype, 'setRequestHeader');
  spySend = jest
    .spyOn(XMLHttpRequest.prototype, 'send')
    .mockImplementation(function send(this: XMLHttpRequest) {
      Promise.resolve().then(() => mockXhrResponse(this));
    });
  jest
    .spyOn(XMLHttpRequest.prototype, 'getAllResponseHeaders')
    .mockReturnValue('content-type: image/png');
  jest
    .spyOn(XMLHttpRequest.prototype, 'getResponseHeader')
    .mockReturnValue('image/png');
});
afterEach(() => {
  jest.restoreAllMocks();
  window.XMLHttpRequest.prototype.open = originOpen;
  window.XMLHttpRequest.prototype.setRequestHeader = originSetRequestHeader;
  window.XMLHttpRequest.prototype.send = originSend;
  NetworkPlugin.hasInitd = false;
});

describe('XMLHttpRequest proxy', () => {
  it('Do nothing if not exist window.XMLHttpRequest', () => {
    const originXHR = window.XMLHttpRequest;
    Object.defineProperty(window, 'XMLHttpRequest', {
      value: undefined,
      writable: true,
    });
    new NetworkPlugin().onInit(initParams);
    expect(window.XMLHttpRequest).toBe(undefined);
    window.XMLHttpRequest = originXHR;
  });
  it('Wrap the XMLHttpRequest prototype method', () => {
    new NetworkPlugin().onInit(initParams);

    expect(XMLHttpRequest.prototype.open).not.toBe(spyOpen);
    expect(XMLHttpRequest.prototype.setRequestHeader).not.toBe(spySetHeader);
    expect(XMLHttpRequest.prototype.send).not.toBe(spySend);
  });

  it("The origin's method will be called and get the response", async () => {
    new NetworkPlugin().onInit(initParams);

    const api = `${apiPrefix}/posts`;
    const xhr = new XMLHttpRequest();
    xhr.open('GET', api);
    xhr.setRequestHeader('X-Name', 'PageSpy');
    expect(spyOpen).toHaveBeenCalled();
    expect(spySetHeader).toHaveBeenCalled();
    const loaded = new Promise<void>((resolve) => {
      xhr.onload = () => {
        expect(JSON.parse(xhr.response)).toEqual(data);
        resolve();
      };
    });
    xhr.send();
    expect(spySend).toHaveBeenCalled();
    await loaded;
  });

  it('Request different type response', () => {
    new NetworkPlugin().onInit(initParams);

    const genPromise = (xhr: XMLHttpRequest) => {
      return new Promise<XMLHttpRequest>((resolve, reject) => {
        xhr.addEventListener('readystatechange', () => {
          if (xhr.readyState === 4) {
            if (xhr.status === 200) {
              resolve(xhr);
            } else {
              reject(new Error('request failed'));
            }
          }
        });
      });
    };

    // plain text
    const xhr1 = new XMLHttpRequest();
    const xhr1_ps = genPromise(xhr1);
    xhr1.responseType = 'text';
    xhr1.open('GET', `${apiPrefix}/plain-text`);
    xhr1.send();

    // blob
    const xhr2 = new XMLHttpRequest();
    const xhr2_ps = genPromise(xhr2);
    xhr2.responseType = 'blob';
    xhr2.open('GET', `${apiPrefix}/blob`);
    xhr2.send();

    // // document
    const xhr3 = new XMLHttpRequest();
    const xhr3_ps = genPromise(xhr3);
    xhr3.responseType = 'document';
    xhr3.open('GET', `${apiPrefix}/html`);
    xhr3.send();

    // json
    const xhr4 = new XMLHttpRequest();
    const xhr4_ps = genPromise(xhr4);
    xhr4.responseType = 'json';
    xhr4.open('GET', `${apiPrefix}/json`);
    xhr4.send();

    // arraybuffer
    const xhr5 = new XMLHttpRequest();
    const xhr5_ps = genPromise(xhr5);
    xhr5.responseType = 'arraybuffer';
    xhr5.open('GET', `${apiPrefix}/blob`);
    xhr5.send();

    return Promise.all([xhr1_ps, xhr2_ps, xhr3_ps, xhr4_ps, xhr5_ps]).then(
      ([ins1, ins2, ins3, ins4, ins5]) => {
        expect(ins1.responseText).toEqual(
          expect.stringContaining('Hello PageSpy'),
        );
        expect(ins2.status).toBe(200);
        const doc = new DOMParser().parseFromString(
          ins3.responseText,
          'text/html',
        );
        const title = doc.querySelector('#app');
        expect(title).toBeInstanceOf(HTMLDivElement);
        expect(ins4.response).toEqual({
          name: 'PageSpy',
        });
        expect(ins5.status).toBe(200);
      },
    );
  });

  it('Big response entity will not be converted to base64 by PageSpy', async () => {
    const np = new NetworkPlugin();
    np.onInit(initParams);
    const { xhrProxy } = np;
    expect(xhrProxy).not.toBe(null);
    expect(computeRequestMapInfo(xhrProxy!).size).toBe(0);

    const bigFileUrl = `${apiPrefix}/big-file`;
    const xhr = new XMLHttpRequest();
    xhr.open('GET', bigFileUrl);
    xhr.responseType = 'blob';
    xhr.send();
    const loaded = new Promise<void>((resolve) => {
      xhr.addEventListener('readystatechange', async () => {
        if (xhr.readyState === 4) {
          if (xhr.status === 200) {
            await waitForTasks();
            const { freezedRequests, size } = computeRequestMapInfo(xhrProxy!);
            expect(size).toBe(1);
            const current = Object.values(freezedRequests)[0];
            expect(current?.response).toBe('[object Blob]');
            expect(current?.responseReason).toBe(Reason.EXCEED_SIZE);
            resolve();
          }
        }
      });
    });
    await loaded;
  });

  it('The SDK record the request information', () => {
    const np = new NetworkPlugin();
    np.onInit(initParams);
    const { xhrProxy } = np;
    expect(xhrProxy).not.toBe(null);
    expect(computeRequestMapInfo(xhrProxy).size).toBe(0);

    const count = 5;
    Array.from({ length: count }).forEach((_, index) => {
      const xhr = new XMLHttpRequest();
      xhr.open('GET', `${apiPrefix}/posts/${index}`);
      xhr.send();
    });
    expect(computeRequestMapInfo(xhrProxy).size).toBe(count);
  });

  it('The cached request items will be freed when no longer needed', async () => {
    jest.useFakeTimers();
    const np = new NetworkPlugin();
    np.onInit(initParams);
    const { xhrProxy } = np;
    expect(xhrProxy).not.toBe(null);
    expect(computeRequestMapInfo(xhrProxy).size).toBe(0);

    const xhr = new XMLHttpRequest();
    xhr.open('GET', `${apiPrefix}/posts`);
    xhr.send();

    expect(computeRequestMapInfo(xhrProxy).size).toBe(1);
    try {
      await jest.advanceTimersByTimeAsync(0);
      expect(computeRequestMapInfo(xhrProxy).size).toBe(1);

      jest.advanceTimersByTime(3000);
      expect(computeRequestMapInfo(xhrProxy).size).toBe(0);
    } finally {
      jest.useRealTimers();
    }
  });
});
