import ErrorPlugin from 'page-spy-mp-base/src/plugins/error';
import { mp } from '../setup';
import { OnInitParams, SpyMP } from 'packages/page-spy-types';
import { Config } from 'page-spy-mp-base/src/config';
import socket from 'page-spy-mp-base/src/helpers/socket';
import { atom } from 'page-spy-base/src';

const initParams = {
  config: new Config().mergeConfig({ api: 'example.com' }),
  socketStore: socket,
  atom,
} as OnInitParams<SpyMP.MPInitConfig>;
const plugin = new ErrorPlugin();

beforeEach(() => {
  plugin.onInit(initParams);
});

const errorOccupied = jest.spyOn(ErrorPlugin.prototype, 'sendMessage');
afterEach(() => {
  errorOccupied.mockClear();
  plugin.onReset();
});

describe('Error plugin', () => {
  it('Trigger error', () => {
    mp.trigger('onError', new Event('error'));
    mp.trigger('onUnhandledRejection', new Event('unhandledrejection'));
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
