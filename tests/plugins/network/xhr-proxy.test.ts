import NetworkPlugin from 'src/plugins/network';
import startServer from '../../server/index';
import data from '../../server/data.json';

const stopServer = startServer();
afterAll(stopServer);

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
  it('Wrap the XMLHttpRequest prototype method', () => {
    new NetworkPlugin().onCreated();

    expect(XMLHttpRequest.prototype.open).not.toBe(spyOpen);
    expect(XMLHttpRequest.prototype.setRequestHeader).not.toBe(spySetHeader);
    expect(XMLHttpRequest.prototype.send).not.toBe(spySend);
  });

  it("The origin's method will be called and get the response", (done) => {
    new NetworkPlugin().onCreated();

    const api = 'http://localhost:6677/posts';
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

  it('The SDK record the request information', () => {
    const np = new NetworkPlugin();
    np.onCreated();
    const { xhrProxy } = np;
    expect(xhrProxy).not.toBe(null);
    expect(Object.keys(xhrProxy!.reqMap).length).toBe(0);

    const count = 5;
    Array.from({ length: count }).forEach((_, index) => {
      const xhr = new XMLHttpRequest();
      xhr.open('GET', `http://localhost:6677/posts/${index}`);
      xhr.send();
    });
    expect(Object.keys(xhrProxy!.reqMap).length).toBe(count);
  });
});
