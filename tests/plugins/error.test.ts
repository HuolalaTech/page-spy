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
  it('Trigger error', () => {
    window.dispatchEvent(new Event('error'));
    window.dispatchEvent(new Event('unhandledrejection'));
    expect(errorOccupied).toHaveBeenCalledTimes(3);
  });
});
