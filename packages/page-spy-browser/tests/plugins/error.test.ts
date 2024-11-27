import { OnInitParams } from 'packages/page-spy-types';
import { atom } from 'page-spy-base/dist/atom';
import { Config, InitConfig } from 'page-spy-browser/src/config';
import socket from 'page-spy-browser/src/helpers/socket';
import ErrorPlugin from 'page-spy-browser/src/plugins/error';

const initParams = {
  config: new Config().mergeConfig({}),
  socketStore: socket,
  atom,
} as OnInitParams<InitConfig>;
beforeAll(() => {
  new ErrorPlugin().onInit(initParams);
});

const errorOccupied = jest.spyOn(ErrorPlugin.prototype, 'sendMessage');
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
