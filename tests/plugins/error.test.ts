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

  it('Should handle error event without error object', () => {
    window.dispatchEvent(new Event('error'));

    expect(errorOccupied).toHaveBeenCalledTimes(3);
    expect(errorOccupied).toHaveBeenCalledWith('An unknown error occurred', {
      name: '',
      message: 'An unknown error occurred',
      stack: 'No stack trace available',
    });
  });
});
