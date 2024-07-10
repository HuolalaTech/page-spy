import {
  makePrimitiveValue,
  getValueType,
  isArrayLike,
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
