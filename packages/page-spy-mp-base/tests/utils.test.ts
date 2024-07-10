import { joinQuery, promisifyMPApi } from 'page-spy-mp-base/src/utils';

afterEach(() => {
  jest.clearAllMocks();
});

describe('Miniprogram utils', () => {
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
