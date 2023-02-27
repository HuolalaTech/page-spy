import { makePrimitiveValue, getValueType } from 'src/utils';

describe('makePrimitiveValue: convert data to showable string', () => {
  it('Primitive undefined is ok', () => {
    expect(makePrimitiveValue(undefined).value).toBe('undefined');
  });
  it('Primitive number is ok', () => {
    expect(makePrimitiveValue(0).value).toBe(0);
    expect(makePrimitiveValue(1).value).toBe(1);
    expect(makePrimitiveValue(-1).value).toBe(-1);
    expect(makePrimitiveValue(Infinity).value).toBe('Infinity');
    expect(makePrimitiveValue(-Infinity).value).toBe('-Infinity');
    expect(makePrimitiveValue(NaN).value).toBe('NaN');
    expect(makePrimitiveValue(123n).value).toBe('123n');
  });
  it('Function is ok', () => {
    expect(makePrimitiveValue(Math.pow).ok).toBe(true);
    expect(makePrimitiveValue(function pow() {}).ok).toBe(true);
    expect(makePrimitiveValue(() => {}).ok).toBe(true);
  });
  it('Symbol is ok', () => {
    expect(makePrimitiveValue(Symbol('foo')).ok).toBe(true);
  });
  it('Error is ok', () => {
    expect(makePrimitiveValue(new Error()).ok).toBe(true);
    expect(makePrimitiveValue(new TypeError()).ok).toBe(true);
    expect(makePrimitiveValue(new SyntaxError()).ok).toBe(true);
    expect(makePrimitiveValue(new ReferenceError()).ok).toBe(true);
  });
  it('Reference type cannot be transformed', () => {
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

  expect(getValueType(123n)).toBe('bigint');
  expect(getValueType(BigInt(123))).toBe('bigint');
  expect(getValueType(123)).toBe('number');
  expect(getValueType(new Number(123))).toBe('object');

  expect(getValueType(() => {})).toBe('function');
  expect(getValueType(function () {})).toBe('function');
  expect(getValueType(new Function())).toBe('function');

  expect(getValueType(new Error())).toBe('error');
  expect(getValueType({})).toBe('object');
  expect(getValueType(new Object())).toBe('object');
  expect(getValueType(Object.create(null))).toBe('object');
  expect(getValueType([])).toBe('object');
  expect(getValueType(new Array())).toBe('object');
});
