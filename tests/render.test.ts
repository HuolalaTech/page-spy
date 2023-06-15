import SDK from 'src/index';
import {
  fireEvent,
  getByAltText,
  getByTestId,
  waitFor,
} from '@testing-library/dom';
import copy from 'copy-to-clipboard';
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
beforeEach(() => {
  SDK.instance = null;
  document.querySelector(rootId)?.remove();
});

describe('Render PageSpy', () => {
  it('Root element and logo', async () => {
    const sdk = new SDK();
    sdk.render();

    const root = document.querySelector(rootId) as HTMLDivElement;

    expect(root).not.toBe(null);
    expect(getByAltText(root!, /pagespy logo/i)).toBeInTheDocument();
  });

  it('Logo is moveable', () => {
    new SDK().render();
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
    new SDK().render();
    const logo = document.querySelector('.page-spy-logo') as HTMLDivElement;
    expect(logo).not.toBe(null);

    fireEvent.click(logo);
    await waitFor(
      () => {
        const html = document.documentElement;
        const modal = getByTestId(html, 'modal');
        const content = getByTestId(html, 'content');
        return Promise.all([
          expect(modal).not.toBe(null),
          expect(content).not.toBe(null),
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
    sdk.name = 'NAME';
    sdk.address = 'ADDRESS';
    sdk.render();

    const logo = document.querySelector('.page-spy-logo') as HTMLDivElement;
    expect(logo).not.toBe(null);
    fireEvent.click(logo);

    await waitFor(() => {
      const html = document.documentElement;
      const copyButton = getByTestId(html, 'copy-button');
      const isVisible = expect(copyButton).not.toBe(null);
      fireEvent.click(copyButton);

      const copied = expect(copy).toHaveBeenCalledWith(
        `${config.clientOrigin}/devtools?version=${sdk.name}&address=${sdk.address}`,
      );
      return Promise.all([isVisible, copied]);
    });
  });
});
