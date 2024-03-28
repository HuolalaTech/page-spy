import PagePlugin from 'page-spy-browser/src/plugins/page';
import socket from 'page-spy-browser/src/helpers/socket';
// @ts-ignore
const trigger = jest.spyOn(PagePlugin, 'collectHtml');

describe('Page plugin', () => {
  it('Collect outerHTML', () => {
    expect(trigger).toHaveBeenCalledTimes(0);

    new PagePlugin().onInit();
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
