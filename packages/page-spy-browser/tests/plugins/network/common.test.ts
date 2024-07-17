import {
  BINARY_FILE_VARIANT,
  addContentTypeHeader,
  formatEntries,
  getContentType,
  getFormattedBody,
} from 'page-spy-base/src';

describe('Network utilities', () => {
  // format the USP and FormData data which be used in request payload,
  // not all entries which implement the IterableIterator
  it('formatEntries()', () => {
    // FormData
    const fd_data = new FormData();
    fd_data.append('color', 'grey');
    fd_data.append('color', 'slate');
    fd_data.append(
      'color',
      new File(['How to get the right text color'], 'Colors.pdf'),
    );
    const fd_data_format = formatEntries(fd_data.entries());
    const fd_data_result = [
      ['color', 'grey'],
      ['color', 'slate'],
      ['color', BINARY_FILE_VARIANT],
    ];
    expect(fd_data_format).toEqual(fd_data_result);

    // USP
    const usp_data = new URLSearchParams('color=red&color=green&color=blue');
    const usp_data_format = formatEntries(usp_data.entries());
    const usp_data_result = [
      ['color', 'red'],
      ['color', 'green'],
      ['color', 'blue'],
    ];
    expect(usp_data_format).toEqual(usp_data_result);
  });

  it('getContentType()', () => {
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

  it('getFormattedBody()', async () => {
    // Null
    const null_body = null;
    const null_body_format = await getFormattedBody(null_body);
    const null_body_expect = null;
    expect(null_body_format).toBe(null_body_expect);

    // String
    const string_body = '[1,2,3,4]';
    const string_body_format = await getFormattedBody(string_body);
    const string_body_expect = string_body;
    expect(string_body_format).toBe(string_body_expect);

    // Document
    const doc_body = new DOMParser().parseFromString(
      '<div></div>',
      'text/html',
    );
    const doc_body_format = await getFormattedBody(doc_body);
    const doc_body_expect = new XMLSerializer().serializeToString(doc_body);
    expect(doc_body_format).toBe(doc_body_expect);

    // BufferSource
    const buffer_body = new Uint8Array([1, 2, 3, 4]);
    const buffer_body_format = await getFormattedBody(buffer_body);
    const buffer_body_result = '[object TypedArray]';
    expect(buffer_body_format).toBe(buffer_body_result);

    // File / Blob
    const blob_body = new Blob(['1234'], { type: 'text/plain' });
    const blob_body_format = await getFormattedBody(blob_body);
    const blob_body_result = '[object Blob]';
    expect(blob_body_format).toBe(blob_body_result);

    // USP
    const usp_body = new URLSearchParams(
      'like=camping&like=fishing&like=driving',
    );
    const usp_body_format = await getFormattedBody(usp_body);
    const usp_body_result = formatEntries(usp_body.entries());
    expect(usp_body_format).toEqual(usp_body_result);

    // FormData
    const fd_body = new FormData();
    fd_body.append('color', 'lightgreen');
    fd_body.append('color', 'slate');
    const fd_body_format = await getFormattedBody(fd_body);
    const fd_body_result = formatEntries(fd_body.entries());
    expect(fd_body_format).toEqual(fd_body_result);
  });
});
