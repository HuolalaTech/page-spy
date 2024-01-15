import ErrorPlugin from 'page-spy-browser/src/plugins/error';

beforeAll(() => {
  new ErrorPlugin().onInit();
});

const errorOccupied = jest.spyOn(ErrorPlugin, 'sendMessage');
afterEach(() => {
  errorOccupied.mockClear();
});

describe('Error plugin', () => {
  it('Trigger error', () => {
    window.dispatchEvent(new Event('error'));
    window.dispatchEvent(new Event('unhandledrejection'));
    expect(errorOccupied).toHaveBeenCalledTimes(3);
  });

  it('Should handle error event without error object', () => {
    window.dispatchEvent(new Event('error'));

    expect(errorOccupied).toHaveBeenCalledTimes(2);
    expect(errorOccupied).toHaveBeenCalledWith(
      '[PageSpy] An unknown error occurred and no stack trace available',
      null,
    );
  });
});
