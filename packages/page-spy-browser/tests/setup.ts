import { TextDecoder, TextEncoder } from 'util';

(global as any).TextDecoder = TextDecoder;
(global as any).TextEncoder = TextEncoder;

import '@testing-library/jest-dom';

// mock global.fetch
import 'whatwg-fetch';

// mock document.currentScript
import { JSDOM } from 'jsdom';
const script = new JSDOM(
  `
  <html>
    <head>
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <script src="https://example.com/page-spy/index.min.js"></script>
    </head>
  </html>
`,
  {
    url: 'https://localhost',
  },
).window.document.querySelector('script');

Object.defineProperty(document, 'currentScript', {
  value: script,
  writable: true,
});

// mock navigator.sendBeacon
global.navigator.sendBeacon = jest.fn<boolean, any>((...args: any) => {
  return true;
});

// mock window.alert
window.alert = () => {};

// mock browser env
Object.defineProperty(document, Symbol.toStringTag, {
  value: 'HTMLDocument',
});

// mock window.cookieStore
import './__mocks__/cookie-store';

// mock window.indexedDB
import 'fake-indexeddb/auto';
import 'core-js/stable/structured-clone';

window.Modernizr = {
  addTest(key: string, support: boolean) {
    void 0;
  },
  on(key: string, cb: (a: boolean) => void) {
    cb(true);
  },
};

// mock window.CSS.supports
if (typeof window.CSS.supports !== 'function') {
  window.CSS.supports = (property: string, value?: string) => {
    return true;
  };
}
