import NetworkPlugin from 'page-spy-mp-base/src/plugins/network';
import { computeRequestMapInfo } from './util';
import { OnInitParams, SpyMP } from 'packages/page-spy-types';
import { atom } from 'page-spy-base/src';
import { Config } from 'page-spy-mp-base/src/config';
import socket from 'page-spy-mp-base/src/helpers/socket';
import { mp } from '../setup';

const initParams = {
  config: new Config().mergeConfig({ api: 'example.com' }),
  socketStore: socket,
  atom,
} as OnInitParams<SpyMP.MPInitConfig>;
const port = 6688;
const apiPrefix = `http://localhost:${port}`;
// const stopServer = startServer(port);
// afterAll(stopServer);

const originRequest = mp.request;
const sleep = (t = 100) => new Promise((r) => setTimeout(r, t));

const plugin = new NetworkPlugin();

afterEach(() => {
  jest.restoreAllMocks();
  mp.request = originRequest;
  plugin.onReset();
});

describe('mp.request proxy', () => {
  it('Do nothing if not exist mp.request', () => {
    Object.defineProperty(mp, 'request', {
      value: undefined,
      writable: true,
    });
    plugin.onInit(initParams);
    expect(mp.request).toBe(undefined);
  });
  it('Wrap mp request', () => {
    const reqSpy = jest.spyOn(mp, 'request');
    expect(mp.request).toBe(reqSpy);
    plugin.onInit(initParams);
    expect(mp.request).not.toBe(reqSpy);
  });

  it('The origin request will be called and get response', (done) => {
    const reqSpy = jest.spyOn(mp, 'request');
    plugin.onInit(initParams);

    // fetch(url, init)
    const url = `/`;
    mp.request({
      url,
      method: 'GET',
      success(res) {
        expect(reqSpy).toBeCalledTimes(1);
        done();
      },
    });
  });

  it('The origin callback will be called', async () => {
    const reqSpy = jest.spyOn(mp, 'request');
    plugin.onInit(initParams);

    const successCallback = jest.fn();
    const completeCallback = jest.fn();
    const failCallback = jest.fn();
    // fetch(url, init)
    mp.request({
      url: '/',
      method: 'GET',
      success: successCallback,
      complete: completeCallback,
    });
    await sleep();
    expect(successCallback).toBeCalled();
    expect(completeCallback).toBeCalled();

    mp.request({
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
    plugin.onInit(initParams);
    mp.request({
      url: '/plain-text',
      success(res) {
        expect(res?.data).toEqual('Hello PageSpy');
        done();
      },
    });
  });

  // automatically parse json
  it('Request json', (done) => {
    mp.request({
      url: '/json',
      success(res) {
        expect(res?.data).toMatchObject({ text: 'Hello PageSpy' });
        done();
      },
    });
  });

  it('Request ArrayBuffer', (done) => {
    mp.request({
      url: '/array-buffer',
      responseType: 'arraybuffer',
      success(res) {
        expect(res?.data).toEqual(new ArrayBuffer(10));
        done();
      },
    });
  });

  it('Array buffer response will not be converted to base64', (done) => {
    plugin.onInit(initParams);
    const { requestProxy } = plugin;
    expect(computeRequestMapInfo(requestProxy).size).toBe(0);

    mp.request({
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
    plugin.onInit(initParams);
    const { requestProxy } = plugin;
    expect(requestProxy).not.toBe(null);
    expect(computeRequestMapInfo(requestProxy).size).toBe(0);

    const count = 5;
    Array.from({ length: count }).forEach((_, index) => {
      mp.request({ url: `${apiPrefix}/posts/${index}` });
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
