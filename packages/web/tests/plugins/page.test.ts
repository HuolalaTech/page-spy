import PagePlugin from 'web/plugins/page';
import { DEBUG_MESSAGE_TYPE } from 'src/utils/message';
import socket from 'web/helpers/socket';
// @ts-ignore
const trigger = jest.spyOn(PagePlugin, 'collectHtml');

describe('Page plugin', () => {
  it('Collect outerHTML', () => {
    expect(trigger).toHaveBeenCalledTimes(0);

    new PagePlugin().onCreated();
    window.dispatchEvent(new Event('load'));
    expect(trigger).toHaveBeenCalledTimes(0);

    // @ts-ignore
    socket.dispatchEvent(DEBUG_MESSAGE_TYPE.REFRESH, {
      source: {
        type: DEBUG_MESSAGE_TYPE.REFRESH,
        data: 'page',
      },
      from: '',
      to: '',
    } as any);
    expect(trigger).toHaveBeenCalledTimes(1);
  });
});
