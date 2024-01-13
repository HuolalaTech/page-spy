import ErrorPlugin from 'mp-base/src/plugins/error';

beforeAll(() => {
  new ErrorPlugin().onCreated();
});

const errorOccupied = jest.spyOn(ErrorPlugin, 'sendMessage');
afterEach(() => {
  errorOccupied.mockClear();
});

describe('Error plugin', () => {
  it('Trigger error', () => {
    mp.trigger('onError', new Event('error'));
    mp.trigger('onUnHandledRejection', new Event('unhandledrejection'));
    expect(errorOccupied).toHaveBeenCalledTimes(2);
  });

  it('Should handle error event without error object', () => {
    mp.trigger('onError', new Event('error'));

    expect(errorOccupied).toHaveBeenCalledTimes(1);
    expect(errorOccupied).toHaveBeenCalledWith(
      '[PageSpy] An unknown error occurred and no message or stack trace available',
      null,
    );
  });
});
