import NetworkPlugin from 'src/plugins/network';
import startServer from '../../server/index';

const stopServer = startServer();

const {
  open: originOpen,
  setRequestHeader: originSetRequestHeader,
  send: originSend,
} = window.XMLHttpRequest.prototype;
const originFetch = window.fetch;
const { sendBeacon: originSendBeacon } = window.navigator;

afterEach(() => {
  jest.restoreAllMocks();
  window.XMLHttpRequest.prototype.open = originOpen;
  window.XMLHttpRequest.prototype.setRequestHeader = originSetRequestHeader;
  window.XMLHttpRequest.prototype.send = originSend;
  window.fetch = originFetch;
  window.navigator.sendBeacon = originSendBeacon;
});
afterAll(stopServer);

describe('Network plugin', () => {
  it('Wrap XMLHttpRequest prototype', (done) => {
    const fakeUrl = 'http://localhost:6677/posts';
    const openSpy = jest.spyOn(XMLHttpRequest.prototype, 'open');
    const setHeaderSpy = jest.spyOn(
      XMLHttpRequest.prototype,
      'setRequestHeader',
    );
    const sendSpy = jest.spyOn(XMLHttpRequest.prototype, 'send');

    new NetworkPlugin().onCreated();
    expect(XMLHttpRequest.prototype.open).not.toBe(openSpy);
    expect(XMLHttpRequest.prototype.setRequestHeader).not.toBe(setHeaderSpy);
    expect(XMLHttpRequest.prototype.send).not.toBe(sendSpy);

    const xhr = new XMLHttpRequest();
    xhr.responseType = 'text';
    const body = { title: 'PageSpy', body: 'XHR Test' };
    const bodyStringify = JSON.stringify(body);
    xhr.open('POST', fakeUrl);
    xhr.setRequestHeader('Content-Type', 'application/json; charset=utf-8');
    xhr.send(bodyStringify);

    expect(openSpy).toHaveBeenCalledWith('POST', fakeUrl);
    expect(setHeaderSpy).toHaveBeenCalledWith(
      'Content-Type',
      'application/json; charset=utf-8',
    );
    expect(sendSpy).toHaveBeenCalledWith(bodyStringify);
    expect(sendSpy).toHaveBeenCalledTimes(1);

    xhr.onload = () => {
      expect(JSON.parse(xhr.response)).toEqual(expect.objectContaining(body));
      done();
    };
  });

  it('XHR json responseType', (done) => {
    new NetworkPlugin().onCreated();

    const fakeUrl = 'http://localhost:6677/posts/1';
    const xhr = new XMLHttpRequest();
    xhr.responseType = 'json';
    xhr.open('GET', fakeUrl);
    xhr.send();

    xhr.onload = () => {
      expect(xhr.response).toMatchObject(
        expect.objectContaining({
          id: expect.any(Number),
          title: expect.any(String),
        }),
      );
      done();
    };
  });

  it('XHR blob responseType', (done) => {
    new NetworkPlugin().onCreated();

    const fakeUrl = 'http://localhost:6677/posts/1';
    const xhr = new XMLHttpRequest();
    xhr.responseType = 'blob';
    xhr.open('GET', fakeUrl);
    xhr.send();

    xhr.onload = () => {
      const fr = new FileReader();
      fr.onload = (e) => {
        expect(JSON.parse(e.target?.result as string)).toMatchObject(
          expect.objectContaining({
            id: expect.any(Number),
            title: expect.any(String),
          }),
        );
        done();
      };
      fr.readAsText(xhr.response);
    };
  });

  it('XHR arraybuffer responseType', (done) => {
    new NetworkPlugin().onCreated();

    const fakeUrl = 'http://localhost:6677/posts/1';
    const xhr = new XMLHttpRequest();
    xhr.responseType = 'arraybuffer';
    xhr.open('GET', fakeUrl);
    xhr.send();

    xhr.onload = () => {
      const result = new TextDecoder().decode(xhr.response);
      expect(JSON.parse(result)).toMatchObject(
        expect.objectContaining({
          id: expect.any(Number),
          title: expect.any(String),
        }),
      );
      done();
    };
  });

  it('Wrap fetch request', async () => {
    const fetchSpy = jest.spyOn(window, 'fetch');
    expect(window.fetch).toBe(fetchSpy);
    new NetworkPlugin().onCreated();
    expect(window.fetch).not.toBe(fetchSpy);

    const fakeUrl = 'http://localhost:6677/posts/1';
    console.log(window.location.href);

    const res = await fetch(fakeUrl, {
      method: 'GET',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    const data = await res.json();
    expect(data).toMatchObject({
      id: expect.any(Number),
      title: expect.any(String),
    });

    const fakeRequest = new Request(fakeUrl, {
      method: 'GET',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    const res2 = await fetch(fakeRequest);
    const data2 = await res2.json();
    expect(data2).toMatchObject({
      id: expect.any(Number),
      title: expect.any(String),
    });
  });

  it('sendBeacon request', async () => {
    const sendBeaconSpy = jest.spyOn(window.navigator, 'sendBeacon');
    expect(window.navigator.sendBeacon).toBe(sendBeaconSpy);
    new NetworkPlugin().onCreated();
    expect(window.navigator.sendBeacon).not.toBe(sendBeaconSpy);

    const fakeUrl = 'http://localhost:6677/posts?search-for=test';
    const body = { title: 'PageSpy', body: 'XHR Test' };
    const bodyStringify = JSON.stringify(body);
    navigator.sendBeacon(fakeUrl, bodyStringify);

    expect(sendBeaconSpy).toHaveBeenCalledWith(fakeUrl, bodyStringify);
  });
});
