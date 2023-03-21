import ErrorPlugin from 'src/plugins/error';

beforeAll(() => {
  window.onerror = function () {
    // placeholder
  };
  new ErrorPlugin().onCreated();
});

const errorOcupied = jest.fn();
jest.spyOn(ErrorPlugin, 'sendMessage').mockImplementation(errorOcupied);
afterEach(() => {
  jest.restoreAllMocks();
});

describe('Error plugin', () => {
  it('window.onerror', () => {
    expect(window.onerror).not.toBe(null);
    window.onerror!('', '', 0, 0, new Error('throw error'));
    expect(errorOcupied).toHaveBeenCalledTimes(1);
  });
  it('window.addEventListener("error", fn)', () => {
    window.dispatchEvent(new Event('error'));
    expect(errorOcupied).toHaveBeenCalledTimes(1);
  });
  it('Promise unhandledrejection', () => {
    window.dispatchEvent(new Event('unhandledrejection'));
    expect(errorOcupied).toHaveBeenCalledTimes(1);
  });
});
