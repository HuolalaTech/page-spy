import ErrorPlugin from 'mp-base/src/plugins/error';
import { mp } from '../setup';

const plugin = new ErrorPlugin();

beforeEach(() => {
  plugin.onInit();
});

const errorOccupied = jest.spyOn(ErrorPlugin, 'sendMessage');
afterEach(() => {
  errorOccupied.mockClear();
  plugin.onReset();
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
