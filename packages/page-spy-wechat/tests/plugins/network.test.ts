import NetworkPlugin from 'page-spy-wechat/src/plugins/network';
import { computeRequestMapInfo } from './util';

const port = 6688;
const apiPrefix = `http://localhost:${port}`;
// const stopServer = startServer(port);
// afterAll(stopServer);

const originRequest = wx.request;
const sleep = (t = 100) => new Promise((r) => setTimeout(r, t));

afterEach(() => {
  jest.restoreAllMocks();
  wx.request = originRequest;
  NetworkPlugin.hasInitd = false;
});

describe('wx.request proxy', () => {
  it('Do nothing if not exist wx.request', () => {
    Object.defineProperty(wx, 'request', {
      value: undefined,
      writable: true,
    });
    new NetworkPlugin().onCreated();
    expect(wx.request).toBe(undefined);
  });
  it('Wrap wx request', () => {
    const reqSpy = jest.spyOn(wx, 'request');
    expect(wx.request).toBe(reqSpy);

    new NetworkPlugin().onCreated();
    expect(wx.request).not.toBe(reqSpy);
  });

  it('The origin request will be called and get response', (done) => {
    const reqSpy = jest.spyOn(wx, 'request');
    new NetworkPlugin().onCreated();

    // fetch(url, init)
    const url = `/`;
    wx.request({
      url,
      method: 'GET',
      success(res) {
        expect(reqSpy).toBeCalledTimes(1);
        done();
      },
    });
  });

  it('The origin callback will be called', async () => {
    const reqSpy = jest.spyOn(wx, 'request');
    new NetworkPlugin().onCreated();

    const successCallback = jest.fn();
    const completeCallback = jest.fn();
    const failCallback = jest.fn();
    // fetch(url, init)
    wx.request({
      url: '/',
      method: 'GET',
      success: successCallback,
      complete: completeCallback,
    });
    await sleep();
    expect(successCallback).toBeCalled();
    expect(completeCallback).toBeCalled();

    wx.request({
      url: '/fail',
      method: 'GET',
      fail: failCallback,
      complete: completeCallback,
    });
    await sleep();
    expect(successCallback).toBeCalled();
    expect(completeCallback).toBeCalledTimes(2);
  });

  it('Request plain text', (done) => {
    new NetworkPlugin().onCreated();
    wx.request({
      url: '/plain-text',
      success(res) {
        expect(res?.data).toEqual('Hello PageSpy');
        done();
      },
    });
  });

  // automatically parse json
  it('Request json', (done) => {
    wx.request({
      url: '/json',
      success(res) {
        expect(res?.data).toMatchObject({ text: 'Hello PageSpy' });
        done();
      },
    });
  });

  it('Request ArrayBuffer', (done) => {
    wx.request({
      url: '/array-buffer',
      responseType: 'arraybuffer',
      success(res) {
        expect(res?.data).toEqual(new ArrayBuffer(10));
        done();
      },
    });
  });

  it('Array buffer response will not be converted to base64', (done) => {
    const np = new NetworkPlugin();
    np.onCreated();
    const { requestProxy } = np;
    expect(computeRequestMapInfo(requestProxy).size).toBe(0);

    wx.request({
      url: `/array-buffer`,
      responseType: 'arraybuffer',
      success(res) {
        expect(res?.data).toEqual(new ArrayBuffer(10));
        const { freezedRequests, size } = computeRequestMapInfo(requestProxy);
        expect(size).toBe(1);
        const current = Object.values(freezedRequests);
        expect(current[0]?.responseType).toBe('arraybuffer');
        expect(current[0]?.response).toBe('[object ArrayBuffer]');
        done();
      },
    });
  });

  it('The SDK record the request information', () => {
    const np = new NetworkPlugin();
    np.onCreated();
    const { requestProxy } = np;
    expect(requestProxy).not.toBe(null);
    expect(computeRequestMapInfo(requestProxy).size).toBe(0);

    const count = 5;
    Array.from({ length: count }).forEach((_, index) => {
      wx.request({ url: `${apiPrefix}/posts/${index}` });
    });
    expect(computeRequestMapInfo(requestProxy).size).toBe(count);
  });

  // it('Big response entity will not be converted to base64 by PageSpy', async () => {
  //   const np = new NetworkPlugin();
  //   np.onCreated();
  //   const { fetchProxy } = np;
  //   expect(computeRequestMapInfo(fetchProxy).size).toBe(0);

  //   const bigFileUrl = `${apiPrefix}/big-file`;
  //   await fetch(bigFileUrl);
  //   await sleep();

  //   const { freezedRequests, size } = computeRequestMapInfo(fetchProxy);
  //   expect(size).toBe(1);
  //   const current = Object.values(freezedRequests);
  //   expect(current[0]?.response).toBe('[object Blob]');
  //   expect(current[0]?.responseReason).toBe(Reason.EXCEED_SIZE);
  // });

  // it('The cached request items will be freed when no longer needed', async () => {
  //   const np = new NetworkPlugin();
  //   np.onCreated();
  //   const { fetchProxy } = np;
  //   expect(fetchProxy).not.toBe(null);
  //   expect(computeRequestMapInfo(fetchProxy).size).toBe(0);

  //   const res = await fetch(`${apiPrefix}/json`);
  //   expect(computeRequestMapInfo(fetchProxy).size).toBe(1);

  //   /**
  //    * The `whatwg-fetch` relies on the setTimeout, the value wouldn't be resolved
  //    * if we use `jest.useFakeTimers()`. So here we use the real timer.
  //    *
  //    * See: {@link https://github.com/jestjs/jest/issues/11103}
  //    */
  //   await sleep(3500);

  //   // The previous request item now be freed after 3s.
  //   expect(computeRequestMapInfo(fetchProxy).size).toBe(0);
  // });
});
