import {
  formatErrorObj,
  getAuthSecret,
  getObjectKeys,
  getRandomId,
  makePrimitiveValue,
  getValueType,
  hasOwnProperty,
  isArray,
  isArrayLike,
  isBigInt,
  isClass,
  isDocument,
  isFile,
  isFormData,
  isHeaders,
  isNumber,
  isObjectLike,
  isPlainObject,
  isPrototype,
  isString,
  isTypedArray,
  isURL,
  isURLSearchParams,
  removeEndSlash,
  stringifyData,
  toStringTag,
} from 'page-spy-base/src';

describe('makePrimitiveValue: convert data to showable string', () => {
  it('✅ Primitive is ok', () => {
    [
      { received: undefined, expected: 'undefined' },
      { received: 0, expected: 0 },
      { received: Infinity, expected: 'Infinity' },
      { received: -Infinity, expected: '-Infinity' },
      { received: NaN, expected: 'NaN' },
      { received: BigInt(123), expected: '123n' },
      { received: Symbol('foo'), expected: 'Symbol(foo)' },
      { received: null, expected: null },
    ].forEach(({ received, expected }) => {
      expect(makePrimitiveValue(received).value).toBe(expected);
    });
  });
  it('✅ Function / Error is ok', () => {
    [Math.pow, () => {}, new Error()].forEach((item) => {
      expect(makePrimitiveValue(item).ok).toBe(true);
    });
  });

  it('❌ Reference type cannot be transformed', () => {
    expect(makePrimitiveValue(new Number(1)).ok).toBe(false);
    expect(makePrimitiveValue(new String('PageSpy')).ok).toBe(false);
    expect(makePrimitiveValue(new Boolean(true)).ok).toBe(false);
    expect(makePrimitiveValue([]).ok).toBe(false);
    expect(makePrimitiveValue({}).ok).toBe(false);
    expect(makePrimitiveValue(Object.prototype).ok).toBe(false);
  });
});

describe('getValueType', () => {
  expect(getValueType(undefined)).toBe('undefined');
  expect(getValueType(null)).toBe('null');
  expect(getValueType(Symbol('foo'))).toBe('symbol');

  expect(getValueType('')).toBe('string');
  expect(getValueType(new String())).toBe('object');

  expect(getValueType(123)).toBe('number');
  expect(getValueType(BigInt(123))).toBe('bigint');
  expect(getValueType(new Number(123))).toBe('object');

  expect(getValueType(() => {})).toBe('function');
  expect(getValueType(function () {})).toBe('function');
  expect(getValueType(new Function())).toBe('function');

  expect(getValueType(new Error())).toBe('error');
  expect(getValueType(new Object())).toBe('object');
  expect(getValueType(Object.create(null))).toBe('object');
  expect(getValueType(new Array())).toBe('object');
});

describe('isArrayLike()', () => {
  const normalList = [1, 2, 3];
  expect(isArrayLike(normalList)).toBe(false);

  const nodeList = document.querySelectorAll('div');
  expect(isArrayLike(nodeList)).toBe(true);

  const htmlCollection = document.scripts;
  expect(isArrayLike(htmlCollection)).toBe(true);
});

describe('general utilities', () => {
  it('identifies primitive values, objects, and browser built-ins', () => {
    const file = new File(['PageSpy'], 'page-spy.txt');

    expect(isString('PageSpy')).toBe(true);
    expect(isNumber(1)).toBe(true);
    expect(isBigInt(BigInt(1))).toBe(true);
    expect(isArray([])).toBe(true);
    expect(isObjectLike({})).toBe(true);
    expect(isObjectLike(null)).toBe(false);
    expect(isPlainObject({})).toBe(true);
    expect(isPlainObject([])).toBe(false);
    expect(isPrototype(Object.prototype)).toBe(true);
    expect(isPrototype({})).toBe(false);
    expect(isTypedArray(new Uint8Array())).toBe(true);
    expect(isURLSearchParams(new URLSearchParams())).toBe(true);
    expect(isFormData(new FormData())).toBe(true);
    expect(isFile(file)).toBe(true);
    expect(isHeaders(new Headers())).toBe(true);
    expect(isDocument(document)).toBe(true);
    expect(isURL(new URL('https://example.com'))).toBe(true);
    expect(isClass(class PageSpy {})).toBe(true);
    expect(isClass('PageSpy')).toBe(false);
  });

  it('formats identifiers and serializable values', () => {
    const random = jest.spyOn(Math, 'random').mockReturnValue(0.5);

    expect(getRandomId()).toBe('i');
    expect(getObjectKeys({ first: 1, second: 2 })).toEqual(['first', 'second']);
    expect(toStringTag([])).toBe('[object Array]');
    expect(hasOwnProperty({ id: 'request-id' }, 'id')).toBe(true);
    expect(stringifyData({ value: undefined })).toBe(
      '{\n  "value": "undefined"\n}',
    );

    random.mockRestore();
  });

  it('formats common network helper values', () => {
    const error = new Error('connection failed');
    const secret = jest.spyOn(Math, 'random').mockReturnValue(0.42);

    expect(removeEndSlash('https://example.com/')).toBe('https://example.com');
    expect(removeEndSlash('https://example.com')).toBe('https://example.com');
    expect(getAuthSecret()).toBe('420000');
    expect(formatErrorObj(error)).toMatchObject({
      name: 'Error',
      message: 'connection failed',
      stack: expect.any(String),
    });
    expect(formatErrorObj({ message: '', stack: '' })).toBeNull();

    secret.mockRestore();
  });
});
