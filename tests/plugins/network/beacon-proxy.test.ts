import NetworkPlugin from 'src/plugins/network';
import startServer from '../../server/index';

const port = 6699;
const apiPrefix = `http://localhost:${port}`;
const stopServer = startServer(port);
afterAll(stopServer);

const { sendBeacon: originSendBeacon } = window.navigator;
afterEach(() => {
  jest.restoreAllMocks();
  window.navigator.sendBeacon = originSendBeacon;
});

describe('navigator.sendBeacon proxy', () => {
  it('Do nothing if not exist navigator.sendBeacon', () => {
    const originBeacon = window.navigator.sendBeacon;
    Object.defineProperty(navigator, 'sendBeacon', {
      value: undefined,
      writable: true,
    });
    new NetworkPlugin().onCreated();
    expect(window.navigator.sendBeacon).toBe(undefined);
    window.navigator.sendBeacon = originBeacon;
  });
  it('Wrap the navigator.sendBeacon', async () => {
    const sendBeaconSpy = jest.spyOn(window.navigator, 'sendBeacon');
    expect(window.navigator.sendBeacon).toBe(sendBeaconSpy);
    new NetworkPlugin().onCreated();
    expect(window.navigator.sendBeacon).not.toBe(sendBeaconSpy);
  });

  it("The origin's method will be called", () => {
    const spyBeacon = jest.spyOn(navigator, 'sendBeacon');
    const api = `${apiPrefix}/posts`;
    const body = new FormData();
    navigator.sendBeacon(api, body);

    expect(spyBeacon).toBeCalledTimes(1);
  });

  it('Mock the truthy / falsy result', () => {
    jest.spyOn(window.navigator, 'sendBeacon').mockImplementation(() => {
      return true;
    });
    const np = new NetworkPlugin();
    np.onCreated();
    const { beaconProxy } = np;
    window.navigator.sendBeacon(`${apiPrefix}/posts`);
    const reqList = Object.values(beaconProxy?.reqMap || {});
    expect(reqList.length).toBeGreaterThan(0);
    expect(reqList[0].status).toBe(200);
  });

  it('Mock the falsy result', () => {
    jest.spyOn(window.navigator, 'sendBeacon').mockImplementation(() => {
      return false;
    });
    const np = new NetworkPlugin();
    np.onCreated();
    const { beaconProxy } = np;
    window.navigator.sendBeacon(`${apiPrefix}/posts`);
    const reqList = Object.values(beaconProxy?.reqMap || {});
    expect(reqList.length).toBeGreaterThan(0);
    expect(reqList[0].status).toBe(500);
  });

  it('The SDK record the request information', () => {
    const np = new NetworkPlugin();
    np.onCreated();
    const { beaconProxy } = np;
    expect(beaconProxy).not.toBe(null);
    expect(Object.keys(beaconProxy!.reqMap).length).toBe(0);

    const count = 5;
    Array.from({ length: count }).forEach((_, index) => {
      navigator.sendBeacon(new URL(`${apiPrefix}/posts/${index}`));
    });
    expect(Object.keys(beaconProxy!.reqMap).length).toBe(count);
  });
});
