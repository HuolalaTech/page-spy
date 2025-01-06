import SDK from 'page-spy-browser/src/index';
import {
  fireEvent,
  getByAltText,
  getByTestId,
  waitFor,
} from '@testing-library/dom';
import copy from 'copy-to-clipboard';
import { toast } from 'page-spy-browser/src/helpers/toast';
jest.mock('copy-to-clipboard', () =>
  jest.fn().mockImplementation((text: string) => true),
);

const rootId = '#__pageSpy';
beforeAll(() => {
  Object.defineProperties(HTMLHtmlElement.prototype, {
    offsetWidth: { value: 1920 },
    offsetHeight: { value: 1080 },
  });
});
afterEach(() => {
  SDK.instance = null;
  document.documentElement.innerHTML = '';
  jest.useRealTimers();
});

describe('Render PageSpy', () => {
  it('Root element and logo', () => {
    const sdk = new SDK();
    sdk['render']();

    const root = document.querySelector(rootId) as HTMLDivElement;
    const logo = document.querySelector('.page-spy-logo') as HTMLDivElement;

    expect(root).not.toBe(null);
    expect(logo).toBeInTheDocument();
  });

  it('Logo is moveable', () => {
    new SDK()['render']();
    const logo = document.querySelector('.page-spy-logo') as HTMLDivElement;
    expect(logo).not.toBe(null);

    logo.style.width = '80px';
    logo.style.height = '80px';
    logo.style.position = 'fixed';
    logo.style.left = '0px';
    logo.style.top = '0px';
    fireEvent.mouseDown(logo, { bubbles: true, clientX: 40, clientY: 40 });
    fireEvent.mouseMove(logo, {
      bubbles: true,
      clientX: 80,
      clientY: 80,
    });
    fireEvent.mouseUp(logo);
    expect(logo).toHaveStyle({
      left: '40px',
      top: '40px',
    });
  });

  it('Click logo to popup modal and content', async () => {
    new SDK()['render']();
    const logo = document.querySelector('.page-spy-logo') as HTMLDivElement;
    expect(logo).not.toBe(null);

    fireEvent.click(logo);
    await waitFor(
      () => {
        const modal = document.querySelector('.modal');
        return Promise.all([
          expect(modal).not.toBe(null),
          expect(modal?.classList).toContain('show'),
        ]);
      },
      { timeout: 100, interval: 50 },
    );
  });

  it('Copy the debug-ui address by click the `Copy` button', async () => {
    const config = {
      api: 'custom-server.com',
      clientOrigin: 'https://debug-ui.com',
    };
    const sdk = new SDK(config);

    sdk.address = 'ADDRESS';
    sdk['render']();

    const logo = document.querySelector('.page-spy-logo') as HTMLDivElement;
    expect(logo).not.toBe(null);
    fireEvent.click(logo);

    await waitFor(() => {
      const toastFn = jest.spyOn(toast, 'message');

      const copyButton = document.querySelector('#page-spy-copy-link');
      const isVisible = expect(copyButton).not.toBe(null);

      fireEvent.click(copyButton!);

      const copied = expect(copy).toHaveBeenCalledWith(
        `${config.clientOrigin}/#/devtools?address=${sdk.address}`,
      );
      const toasted = expect(toastFn).toHaveBeenCalledTimes(1);
      return Promise.all([isVisible, copied, toasted]);
    });
  });

  it('toast static method', () => {
    jest.useFakeTimers();

    expect(document.querySelector('.page-spy-toast')).toBe(null);

    toast.message('Hello PageSpy');
    expect(document.querySelectorAll('.page-spy-toast').length).toBe(1);
    jest.advanceTimersByTime(3000);
    expect(document.querySelectorAll('.page-spy-toast').length).toBe(0);

    toast.message('The 1st message');
    toast.message('The 2nd message');
    toast.message('The 3rd message');
    expect(document.querySelectorAll('.page-spy-toast').length).toBe(3);

    toast.destroy();
    expect(document.querySelectorAll('.page-spy-toast').length).toBe(0);
  });
});
