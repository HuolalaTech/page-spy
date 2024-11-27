import PagePlugin from 'page-spy-browser/src/plugins/page';
import socket from 'page-spy-browser/src/helpers/socket';
import { OnInitParams } from 'packages/page-spy-types';
import { Config, InitConfig } from 'page-spy-browser/src/config';
import { atom } from 'page-spy-base/dist/atom';

const initParams = {
  config: new Config().mergeConfig({}),
  socketStore: socket,
  atom,
} as OnInitParams<InitConfig>;
const trigger = jest.spyOn(PagePlugin, 'collectHtml');

describe('Page plugin', () => {
  it('Collect outerHTML', () => {
    expect(trigger).toHaveBeenCalledTimes(0);

    new PagePlugin().onInit(initParams);
    window.dispatchEvent(new Event('load'));
    expect(trigger).toHaveBeenCalledTimes(0);

    // @ts-ignore
    socket.dispatchEvent('refresh', {
      source: {
        type: 'refresh',
        data: 'page',
      },
      from: '',
      to: '',
    } as any);
    expect(trigger).toHaveBeenCalledTimes(1);
  });
});
