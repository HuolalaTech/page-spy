import {
  addContentTypeHeader,
  formatEntries,
  getContentType,
  getFormattedBody,
  isOkStatusCode,
  toLowerKeys,
} from 'page-spy-base/src';

describe('Network common utils', () => {
  it('getFormattedBody()', () => {
    const bodyData = [
      new URLSearchParams(),
      new FormData(),
      new Blob(),
      new Uint8Array(),
      new Document(),
      '',
    ];

    bodyData.forEach((i) => {
      expect(() => {
        getFormattedBody(i);
      }).not.toThrow();
    });
  });
});

describe('Network request helpers', () => {
  it('formats repeated form entries and marks files', () => {
    const params = new URLSearchParams();
    params.append('tag', 'one');
    params.append('tag', 'two');

    expect(formatEntries(params.entries())).toEqual([
      ['tag', 'one'],
      ['tag', 'two'],
    ]);
  });

  it('detects supported request content types', () => {
    const documentBody = document.implementation.createDocument('', 'root');

    expect(getContentType(new FormData())).toBe('multipart/form-data');
    expect(getContentType(new URLSearchParams())).toBe(
      'application/x-www-form-urlencoded;charset=UTF-8',
    );
    expect(getContentType(documentBody)).toBe('application/xml');
    expect(getContentType(new Blob([], { type: 'text/plain' }))).toBe(
      'text/plain',
    );
    expect(getContentType('payload')).toBe('text/plain;charset=UTF-8');
    expect(getContentType(null)).toBeNull();
  });

  it('adds a content type header only when one is missing', () => {
    expect(addContentTypeHeader(null, 'payload')).toEqual([
      ['Content-Type', 'text/plain;charset=UTF-8'],
    ]);
    expect(
      addContentTypeHeader([['content-type', 'application/json']], 'x'),
    ).toEqual([['content-type', 'application/json']]);
    expect(
      addContentTypeHeader([['Accept', 'application/json']], null),
    ).toEqual([['Accept', 'application/json']]);
  });

  it('formats supported request bodies', async () => {
    const params = new URLSearchParams('page=1');
    const documentBody = document.implementation.createDocument('', 'root');

    expect(await getFormattedBody(params)).toEqual([['page', '1']]);
    expect(await getFormattedBody(new Blob())).toBe('[object Blob]');
    expect(await getFormattedBody(new Uint8Array())).toBe(
      '[object TypedArray]',
    );
    expect(await getFormattedBody(documentBody)).toBe('<root/>');
    expect(await getFormattedBody('payload')).toBe('payload');
  });

  it('normalizes status codes and object keys', () => {
    expect(isOkStatusCode(200)).toBe(true);
    expect(isOkStatusCode(399)).toBe(true);
    expect(isOkStatusCode(400)).toBe(false);
    expect(toLowerKeys({ CONTENT_TYPE: 'json', Accept: 'text' })).toEqual({
      content_type: 'json',
      accept: 'text',
    });
  });
});
