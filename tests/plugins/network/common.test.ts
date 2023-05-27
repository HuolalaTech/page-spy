import {
  addContentTypeHeader,
  getContentType,
  resolveUrlInfo,
} from 'src/plugins/network/proxy/common';

describe('Network utilities', () => {
  describe('resolveUrlInfo()', () => {
    it('Normal location context', () => {
      const urlInfo = resolveUrlInfo('./foo?bar=bar');
      expect(urlInfo).toEqual({
        url: 'http://localhost/foo?bar=bar',
        name: 'foo?bar=bar',
        query: [['bar', 'bar']],
      });
    });
    it('Format `Name` field', () => {
      [
        { received: 'https://exp.com', expected: 'exp.com' },
        { received: 'https://exp.com/', expected: 'exp.com' },
        { received: 'https://exp.com/devtools', expected: 'devtools' },
        { received: 'https://exp.com/devtools/', expected: 'devtools' },
        {
          received: 'https://exp.com/devtools?version=Mac/10.15.7',
          expected: 'devtools?version=Mac/10.15.7',
        },
        {
          received: 'https://exp.com/devtools/?version=Mac/10.15.7',
          expected: 'devtools?version=Mac/10.15.7',
        },
      ].forEach(({ received, expected }) => {
        expect(resolveUrlInfo(received).name).toBe(expected);
      });
    });
  });

  describe('getContentType()', () => {
    [
      {
        received: null,
        expected: null,
      },
      {
        received: new DOMParser().parseFromString('<div></div>', 'text/xml'),
        expected: 'application/xml',
      },
      {
        received: new Blob(['Hello PageSpy'], { type: 'text/plain' }),
        expected: 'text/plain',
      },
      {
        received: new Uint8Array([1, 2, 3, 4, 5]).buffer,
        expected: 'text/plain;charset=UTF-8',
      },
      {
        received: new FormData(),
        expected: 'multipart/form-data',
      },
      {
        received: new URLSearchParams('foo=foo'),
        expected: 'application/x-www-form-urlencoded;charset=UTF-8',
      },
      {
        received: '{"Hello":"PageSpy"}',
        expected: 'text/plain;charset=UTF-8',
      },
    ].forEach(({ received, expected }) => {
      expect(getContentType(received)).toBe(expected);
    });
  });
  it('addContentTypeHeader()', () => {
    type Headers = [string, string][];
    const headers_null = null;
    const headers_no_ct: Headers = [['X-Name', 'PageSpy']];
    const headers_upper_ct: Headers = [
      ['Content-Type', 'text/plain;charset=UTF-8'],
    ];
    const headers_lower_ct: Headers = [
      ['content-type', 'text/plain;charset=UTF-8'],
    ];

    const body_null = null;
    const body_entity = 'String body';
    expect(addContentTypeHeader(headers_null, body_null)).toBe(headers_null);
    expect(addContentTypeHeader(headers_null, body_entity)).toEqual(
      headers_upper_ct,
    );
    expect(addContentTypeHeader(headers_no_ct, body_entity)).toEqual([
      ...headers_no_ct,
      ...headers_upper_ct,
    ]);
    expect(addContentTypeHeader(headers_lower_ct, body_entity)).toEqual(
      headers_lower_ct,
    );
  });
});
