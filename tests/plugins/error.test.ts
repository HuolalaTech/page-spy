import ErrorPlugin from 'src/plugins/error';

beforeAll(() => {
  new ErrorPlugin().onCreated();
});

const errorOccupied = jest.fn();
jest.spyOn(ErrorPlugin, 'sendMessage').mockImplementation(errorOccupied);
afterEach(() => {
  jest.restoreAllMocks();
});

describe('Error plugin', () => {
  describe('Uncaught Error', () => {
    it('Have initiator value', (done) => {
      expect(window.onerror).not.toBeFalsy();

      setTimeout(() => {
        throw new Error('Unit test');
      });
      setTimeout(() => {
        expect(errorOccupied).toHaveBeenCalledTimes(1);
        done();
      }, 10);
    });
    it('Register new error function', (done) => {
      const fn = jest.fn();
      window.onerror = fn;
      setTimeout(() => {
        throw new Error('Unit test');
      });

      setTimeout(() => {
        expect(fn).toHaveBeenCalledTimes(1);
        expect(errorOccupied).toHaveBeenCalledTimes(1);
        done();
      }, 10);
    });
    it('Only the last registration will take effect if assign many times', (done) => {
      const fn1 = jest.fn();
      const fn2 = jest.fn();
      const fn3 = jest.fn();
      window.onerror = fn1;
      window.onerror = fn2;
      window.onerror = fn3;

      setTimeout(() => {
        throw new Error('Unit test');
      });
      setTimeout(() => {
        expect([
          fn1.mock.calls.length,
          fn2.mock.calls.length,
          fn3.mock.calls.length,
        ]).toEqual([0, 0, 1]);
        done();
      }, 10);
    });
  });
  it('Resource load failed error', () => {
    window.dispatchEvent(new Event('error'));
    expect(errorOccupied).toHaveBeenCalledTimes(1);
  });
  it('Unhandledrejection error', () => {
    window.dispatchEvent(new Event('unhandledrejection'));
    expect(errorOccupied).toHaveBeenCalledTimes(1);
  });
});
