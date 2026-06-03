export function getRandomId() {
  return Math.random().toString(36).slice(2);
}
export function getObjectKeys<T extends Record<string, any>>(obj: T) {
  return Object.keys(obj) as (keyof T)[];
}

export function toStringTag(value: any) {
  return Object.prototype.toString.call(value);
}

export function hasOwnProperty(target: Object, key: string) {
  return Object.prototype.hasOwnProperty.call(target, key);
}

export enum ConsoleExportMode {
  Original = 'original',
  Complete = 'complete',
}

export type ConsoleExportModeValue = 'original' | 'complete';

export function isCompleteConsoleExportMode(
  config?: { consoleExportMode?: ConsoleExportModeValue | null } | null,
) {
  return config?.consoleExportMode === ConsoleExportMode.Complete;
}

export function isString(value: unknown): value is string {
  return typeof value === 'string';
}

export function isNumber(value: unknown): value is number {
  return typeof value === 'number';
}

export function isBigInt(value: unknown): value is bigint {
  return toStringTag(value) === '[object BigInt]';
}

export function isArray(value: unknown): value is unknown[] {
  return value instanceof Array;
}

export function isObjectLike(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

export function isPlainObject(
  value: unknown,
): value is Record<string, unknown> {
  if (!isObjectLike(value) || toStringTag(value) !== '[object Object]') {
    return false;
  }
  return true;
}

export function isPrototype(value: unknown): value is Object {
  if (
    isObjectLike(value) &&
    hasOwnProperty(value, 'constructor') &&
    typeof value.constructor === 'function'
  ) {
    return true;
  }
  return false;
}

export function isArrayBuffer(value: unknown): value is ArrayBuffer {
  return value instanceof ArrayBuffer;
}

export function isClass(obj: unknown): obj is Function {
  return typeof obj === 'function' && typeof obj.prototype !== 'undefined';
}

type TypedArray =
  | Int8Array
  | Uint8Array
  | Uint8ClampedArray
  | Int16Array
  | Uint16Array
  | Int32Array
  | Uint32Array
  | Float32Array
  | Float64Array
  | BigInt64Array
  | BigUint64Array;
export function isTypedArray(value: unknown): value is TypedArray {
  return ArrayBuffer.isView(value);
}

interface PrimitiveResult {
  ok: boolean;
  value: any;
}

const stringify = (value: any) => `${value}`;
const primitive = (value: any) => ({
  ok: true,
  value,
});

export function makePrimitiveValue(value: unknown): PrimitiveResult {
  if (value === undefined) {
    return primitive(stringify(value));
  }
  if (value === null) {
    return primitive(value);
  }
  if (isNumber(value)) {
    if (value === -Infinity || value === Infinity || Number.isNaN(value)) {
      return primitive(stringify(value));
    }
  }
  if (isBigInt(value)) {
    return primitive(`${value}n`);
  }
  if (typeof value === 'symbol' || typeof value === 'function') {
    return primitive(stringify(value.toString()));
  }
  if (value instanceof Error) {
    return primitive(stringify(value.stack!));
  }
  if (value === Object.prototype) {
    return {
      value: null,
      ok: false,
    };
  }
  if (!(value instanceof Object || typeof value === 'object')) {
    return primitive(value);
  }
  return {
    value,
    ok: false,
  };
}

/**
 * convert `symbol / error / undefined / function` type data to readable string content
 */
export function stringifyData(data: any): any {
  const { ok, value } = makePrimitiveValue(data);
  if (ok) {
    return value;
  }
  return JSON.stringify(data, (key, val) => makePrimitiveValue(val).value, 2);
}

function getSerializableType(value: any) {
  return value?.constructor?.name || toStringTag(value).slice(8, -1);
}

interface SerializableSnapshotResult {
  value: any;
  complete: boolean;
}

const completeSnapshot = (value: any): SerializableSnapshotResult => ({
  value,
  complete: true,
});

const incompleteSnapshot = (): SerializableSnapshotResult => ({
  value: null,
  complete: false,
});

function instanceOfGlobal(value: any, name: string) {
  const ctor = (globalThis as any)[name];
  return typeof ctor === 'function' && value instanceof ctor;
}

function isKnownIncompleteSnapshotValue(value: any) {
  return [
    'Node',
    'Window',
    'Document',
    'Element',
    'Blob',
    'File',
    'FormData',
    'Headers',
    'Promise',
    'WeakMap',
    'WeakSet',
  ].some((name) => instanceOfGlobal(value, name));
}

function makeSerializableSnapshot(
  data: any,
  visited = new WeakSet<object>(),
): SerializableSnapshotResult {
  const { ok, value } = makePrimitiveValue(data);
  if (ok) {
    return completeSnapshot(value);
  }

  if (!isObjectLike(data)) {
    return completeSnapshot(data);
  }

  if (isKnownIncompleteSnapshotValue(data)) {
    return incompleteSnapshot();
  }

  if (visited.has(data)) {
    return completeSnapshot('[Circular]');
  }
  visited.add(data);

  if (data instanceof Date) {
    return completeSnapshot(
      Number.isNaN(data.getTime()) ? data.toString() : data.toISOString(),
    );
  }

  if (data instanceof RegExp) {
    return completeSnapshot(data.toString());
  }

  if (isArray(data)) {
    const values: any[] = [];
    const items = Array.from(data);
    for (let index = 0; index < items.length; index += 1) {
      const item = items[index];
      const snapshot = makeSerializableSnapshot(item, visited);
      if (!snapshot.complete) {
        return incompleteSnapshot();
      }
      values.push(snapshot.value);
    }
    return completeSnapshot(values);
  }

  if (data instanceof Map) {
    const entries: any[] = [];
    const mapEntries = Array.from(data.entries());
    for (let index = 0; index < mapEntries.length; index += 1) {
      const [key, val] = mapEntries[index];
      const keySnapshot = makeSerializableSnapshot(key, visited);
      const valueSnapshot = makeSerializableSnapshot(val, visited);
      if (!keySnapshot.complete || !valueSnapshot.complete) {
        return incompleteSnapshot();
      }
      entries.push([keySnapshot.value, valueSnapshot.value]);
    }
    return completeSnapshot({
      __type: 'Map',
      entries,
    });
  }

  if (data instanceof Set) {
    const values: any[] = [];
    const setValues = Array.from(data.values());
    for (let index = 0; index < setValues.length; index += 1) {
      const val = setValues[index];
      const snapshot = makeSerializableSnapshot(val, visited);
      if (!snapshot.complete) {
        return incompleteSnapshot();
      }
      values.push(snapshot.value);
    }
    return completeSnapshot({
      __type: 'Set',
      values,
    });
  }

  if (isArrayBuffer(data)) {
    return completeSnapshot({
      __type: 'ArrayBuffer',
      bytes: Array.from(new Uint8Array(data)),
    });
  }

  if (isTypedArray(data)) {
    const view = data as any;
    return completeSnapshot({
      __type: getSerializableType(data),
      bytes:
        typeof view.length === 'number'
          ? Array.from(view)
          : Array.from(
              new Uint8Array(view.buffer, view.byteOffset, view.byteLength),
            ),
    });
  }

  const result: Record<string, any> = {};
  const type = getSerializableType(data);
  if (type && type !== 'Object' && !isArray(data)) {
    result.__type = type;
  }

  const keys = Object.keys(data);
  for (let index = 0; index < keys.length; index += 1) {
    const key = keys[index];
    const desc = Object.getOwnPropertyDescriptor(data, key);
    if (!desc) {
      continue;
    }
    if (hasOwnProperty(desc, 'value')) {
      const snapshot = makeSerializableSnapshot(desc.value, visited);
      if (!snapshot.complete) {
        return incompleteSnapshot();
      }
      result[key] = snapshot.value;
      continue;
    }

    const accessor = [
      desc.get ? 'Getter' : '',
      desc.set ? 'Setter' : '',
    ].filter(Boolean);
    result[key] = `[${accessor.join('/') || 'Accessor'}]`;
  }

  if (
    type &&
    type !== 'Object' &&
    !isArray(data) &&
    Object.keys(result).length === 1 &&
    result.__type === type
  ) {
    return incompleteSnapshot();
  }

  return completeSnapshot(result);
}

export function stringifyJsonSnapshot(data: any): string | null {
  try {
    const snapshot = makeSerializableSnapshot(data);
    if (!snapshot.complete) {
      return null;
    }
    return JSON.stringify(snapshot.value);
  } catch (e) {
    return null;
  }
}

export function getValueType(value: any) {
  if (value === undefined) return 'undefined';
  if (value === null) return 'null';
  if (isBigInt(value)) return 'bigint';
  if (value instanceof Object) {
    if (value instanceof Error) return 'error';
    if (value instanceof Function) return 'function';
    return 'object';
  }
  return typeof value;
}

// Usage 1: `psLog.<fn>` to print system level debug info to developer
interface LogMethods {
  log(...message: any[]): void;
  info(...message: any[]): void;
  warn(...message: any[]): void;
  error(...message: any[]): void;
  debug(...message: any[]): void;
}

interface PSLog extends LogMethods {
  // Usage 2: `psLog.unproxy.<fn>` to print debug info for self debugging.
  unproxy: LogMethods;
}

const unproxyConsole = { ...console };

export const psLog = (
  ['log', 'info', 'error', 'warn', 'debug'] as const
).reduce(
  (result, method) => {
    result[method] = (...message: any[]) => {
      console[method](`[PageSpy] [${method.toLocaleUpperCase()}] `, ...message);
    };
    result.unproxy[method] = (...message: any[]) => {
      unproxyConsole[method](
        `[PageSpy] [${method.toLocaleUpperCase()}] `,
        ...message,
      );
    };
    return result;
  },
  { unproxy: {} } as PSLog,
);

export function getAuthSecret() {
  const secret = Math.floor(Math.random() * 1000000);
  return String(secret).padStart(6, '0');
}

export function isNotEmpty(value: unknown): value is object {
  return value !== null && value !== undefined;
}
