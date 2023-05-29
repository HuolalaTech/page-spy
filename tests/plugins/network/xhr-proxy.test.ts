import NetworkPlugin from 'src/plugins/network';
import startServer from '../../server/index';
import data from '../../server/data.json';
import { Reason } from 'src/plugins/network/proxy/common';

const port = 6677;
const apiPrefix = `http://localhost:${port}`;
const stopServer = startServer(port);
afterAll(stopServer);

const sleep = (t = 100) => new Promise((r) => setTimeout(r, t));

const spyOpen = jest.spyOn(XMLHttpRequest.prototype, 'open');
const spySetHeader = jest.spyOn(XMLHttpRequest.prototype, 'setRequestHeader');
const spySend = jest.spyOn(XMLHttpRequest.prototype, 'send');

const {
  open: originOpen,
  setRequestHeader: originSetRequestHeader,
  send: originSend,
} = window.XMLHttpRequest.prototype;
afterEach(() => {
  jest.restoreAllMocks();
  window.XMLHttpRequest.prototype.open = originOpen;
  window.XMLHttpRequest.prototype.setRequestHeader = originSetRequestHeader;
  window.XMLHttpRequest.prototype.send = originSend;
});

describe('XMLHttpRequest proxy', () => {
  it('Do nothing if not exist window.XMLHttpRequest', () => {
    const originXHR = window.XMLHttpRequest;
    Object.defineProperty(window, 'XMLHttpRequest', {
      value: undefined,
      writable: true,
    });
    new NetworkPlugin().onCreated();
    expect(window.XMLHttpRequest).toBe(undefined);
    window.XMLHttpRequest = originXHR;
  });
  it('Wrap the XMLHttpRequest prototype method', () => {
    new NetworkPlugin().onCreated();

    expect(XMLHttpRequest.prototype.open).not.toBe(spyOpen);
    expect(XMLHttpRequest.prototype.setRequestHeader).not.toBe(spySetHeader);
    expect(XMLHttpRequest.prototype.send).not.toBe(spySend);
  });

  it("The origin's method will be called and get the response", (done) => {
    new NetworkPlugin().onCreated();

    const api = `${apiPrefix}/posts`;
    const xhr = new XMLHttpRequest();
    xhr.open('GET', api);
    xhr.setRequestHeader('X-Name', 'PageSpy');
    xhr.send();

    expect(spyOpen).toHaveBeenCalled();
    expect(spySetHeader).toHaveBeenCalled();
    expect(spySend).toHaveBeenCalled();
    xhr.onload = () => {
      expect(JSON.parse(xhr.response)).toEqual(data);
      done();
    };
  });

  it('Request different type response', () => {
    new NetworkPlugin().onCreated();

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

    return Promise.all([xhr1_ps, xhr2_ps, xhr3_ps, xhr4_ps, xhr5_ps])
      .then(([ins1, ins2, ins3, ins4, ins5]) => {
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
        expect(ins4).toEqual({
          name: 'PageSpy',
        });
        expect(ins5.status).toBe(200);
      })
      .catch((e) => {
        console.log('XHR execute failed: ', e.message);
      });
  });

  it('Big response entity will not be converted to base64 by PageSpy', (done) => {
    const np = new NetworkPlugin();
    np.onCreated();
    const { xhrProxy } = np;

    const map = xhrProxy!.reqMap;
    expect(Object.values(map).length).toBe(0);

    const bigFileUrl = `${apiPrefix}/big-file`;
    const xhr = new XMLHttpRequest();
    xhr.open('GET', bigFileUrl);
    xhr.responseType = 'blob';
    xhr.send();
    xhr.addEventListener('readystatechange', async () => {
      if (xhr.readyState === 4) {
        if (xhr.status === 200) {
          await sleep();
          const reqList = Object.values(map);
          expect(reqList.length).toBe(1);
          expect(reqList[0].response).toBe('[object Blob]');
          expect(reqList[0].responseReason).toBe(Reason.EXCEED_SIZE);
          done();
        }
      }
    });
  });

  it('The SDK record the request information', () => {
    const np = new NetworkPlugin();
    np.onCreated();
    const { xhrProxy } = np;
    expect(xhrProxy).not.toBe(null);
    expect(Object.keys(xhrProxy!.reqMap).length).toBe(0);

    const count = 5;
    Array.from({ length: count }).forEach((_, index) => {
      const xhr = new XMLHttpRequest();
      xhr.open('GET', `${apiPrefix}/posts/${index}`);
      xhr.send();
    });
    expect(Object.keys(xhrProxy!.reqMap).length).toBe(count);
  });
});
