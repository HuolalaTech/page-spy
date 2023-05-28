import NetworkPlugin from 'src/plugins/network';
import startServer from '../../server/index';

const stopServer = startServer();
afterAll(stopServer);

const { sendBeacon: originSendBeacon } = window.navigator;

afterEach(() => {
  jest.restoreAllMocks();
  window.navigator.sendBeacon = originSendBeacon;
});

describe('navigator.sendBeacon proxy', () => {
  it('Wrap the navigator.sendBeacon', async () => {
    const sendBeaconSpy = jest.spyOn(window.navigator, 'sendBeacon');
    expect(window.navigator.sendBeacon).toBe(sendBeaconSpy);
    new NetworkPlugin().onCreated();
    expect(window.navigator.sendBeacon).not.toBe(sendBeaconSpy);
  });

  it("The origin's method will be called", () => {
    const spyBeacon = jest.spyOn(navigator, 'sendBeacon');
    const api = 'http://localhost:6677/posts';
    const body = new FormData();
    navigator.sendBeacon(api, body);

    expect(spyBeacon).toBeCalledTimes(1);
  });

  it('The SDK record the request information', () => {
    const np = new NetworkPlugin();
    np.onCreated();
    const { beaconProxy } = np;
    expect(beaconProxy).not.toBe(null);
    expect(Object.keys(beaconProxy!.reqMap).length).toBe(0);

    const count = 5;
    Array.from({ length: count }).forEach((_, index) => {
      navigator.sendBeacon(new URL(`http://localhost:6677/posts/${index}`));
    });
    expect(Object.keys(beaconProxy!.reqMap).length).toBe(count);
  });
});
