import ErrorPlugin from 'page-spy-react-native/src/plugins/error';

const plugin = new ErrorPlugin();

declare const ErrorUtils: any;

beforeEach(() => {});

const errorOccupied = jest.spyOn(ErrorPlugin, 'sendMessage');
afterEach(() => {
  errorOccupied.mockClear();
  plugin.onReset();
});

describe('Error plugin', () => {
  it('Trigger error', () => {
    ErrorUtils.triggerError(new Error('error'));
    expect(errorOccupied).toHaveBeenCalledTimes(1);
  });

  it('Should handle error event without error object', () => {
    ErrorUtils.triggerError(new Error());

    expect(errorOccupied).toHaveBeenCalledTimes(1);
    expect(errorOccupied).toHaveBeenCalledWith(
      '[PageSpy] An unknown error occurred and no message or stack trace available',
      null,
    );
  });

  it('Should handle unhandledreject of Promise', () => {
    Promise.reject('mock reject');
    setImmediate(() => {
      expect(errorOccupied).toHaveBeenCalledTimes(1);
    });
  });
});
