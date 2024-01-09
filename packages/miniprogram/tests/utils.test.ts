import { getDeviceInfo, joinQuery, promisifyMPApi } from 'src/utils';

afterEach(() => {
  jest.clearAllMocks();
});

describe('Miniprogram utils', () => {
  it('Get device info', () => {
    expect(getDeviceInfo()).toMatchObject({
      osName: 'iOS',
      osVersion: '14.0.1',
      browserName: 'MPWeChat',
      browserVersion: '1.0.0',
    });

    jest.spyOn(wx, 'getSystemInfoSync').mockImplementation(() => {
      return {
        platform: 'devtools',
        system: 'iOS 14.0.1',
        version: '1.0.0',
      };
    });
    expect(getDeviceInfo()).toMatchObject({
      osName: 'iOS',
      osVersion: '14.0.1',
      browserName: 'MPWeChat',
      browserVersion: '1.0.0',
    });
  });

  it('Join query', () => {
    expect(joinQuery({ a: 1, b: 2 })).toBe('a=1&b=2');
    expect(joinQuery({ a: 1 })).toBe('a=1');
    expect(joinQuery({})).toBe('');
  });

  it('Promisify', () => {
    function A(params: {
      success: (res: any) => void;
      fail: (err: any) => void;
      complete: () => void;
    }) {
      params.success({
        a: 1,
        b: 2,
      });
    }
    const promisifyA = promisifyMPApi(A);
    promisifyA({}).then((res) => {
      expect(res).toMatchObject({
        a: 1,
        b: 2,
      });
    });

    function B(params: {
      success: (res: any) => void;
      fail: (err: any) => void;
      complete: () => void;
    }) {
      params.fail({
        a: 1,
        b: 2,
      });
    }
    const promisifyB = promisifyMPApi(B);
    promisifyB({}).catch((res) => {
      expect(res).toMatchObject({
        a: 1,
        b: 2,
      });
    });
  });
});
