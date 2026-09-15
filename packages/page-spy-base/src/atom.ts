/* eslint-disable no-restricted-syntax */
/* eslint-disable guard-for-in */
import type { SpyAtom } from '@huolala-tech/page-spy-types';
import {
  getRandomId,
  getValueType,
  hasOwnProperty,
  isArray,
  isArrayLike,
  isModuleNamespace,
  isPlainObject,
  isPrototype,
  makePrimitiveValue,
} from './utils';
import { ATOM_CONFIG } from './constants';

/**
 * Atom representation returned when a complex value is serialized inline.
 *
 * This is intentionally separate from `SpyAtom.Overview`: the public type
 * predates the `serializeData` option and does not include the `json` variant.
 */
export interface SerializedAtomOverview {
  id: string;
  type: 'json';
  value: string | null | undefined;
}

/**
 * Atom 类用于处理复杂对象的序列化
 *
 * 远程调试时无法直接序列化循环引用、getter、原型链等复杂结构。
 * Atom 采用"引用存储"方案：复杂对象存入 store，返回包含 __atomId 的引用，
 * Web 端按需通过 atom-detail 消息获取详情。
 */
export class Atom {
  public store: Record<string, any> = {};

  public getStore() {
    return this.store;
  }

  public resetStore() {
    this.store = {};
    this.storeKeys = [];
  }

  // Store instance IDs for getter invocation: { atomId: instanceId }
  // Prototype objects inherit parent's instanceId to bind correct `this` when calling getters
  public instanceStore: Record<string, string> = {};

  public getInstanceStore() {
    return this.instanceStore;
  }

  public resetInstanceStore() {
    this.instanceStore = {};
  }

  // Defaults to ATOM_CONFIG.MAX_STORE_SIZE; once exceeded, evict oldest entries (FIFO).
  public maxStoreSize: number = ATOM_CONFIG.MAX_STORE_SIZE;

  // Insertion-ordered key list for efficient eviction
  private storeKeys: string[] = [];

  /**
   * Transforms any JavaScript value into an atom representation for remote inspection.
   *
   * Strategy:
   * 1. Primitives (string/number/boolean/null/undefined) → inline value
   * 2. Complex objects with serializeData=true → JSON string
   * 3. Complex objects with serializeData=false → atom reference (stored for later expansion)
   *
   * @param data - The value to transform
   * @param serializeData - If true, serialize complex objects to JSON instead
   *                        of creating references
   * @returns An atom structure with id, type, and value/reference
   */
  public transformToAtom(
    data: unknown,
    serializeData = false,
  ): SpyAtom.Overview | SerializedAtomOverview {
    const { value, ok } = makePrimitiveValue(data);
    const id = getRandomId();
    if (ok) {
      return {
        id,
        type: getValueType(data),
        value,
      };
    }
    if (serializeData) {
      try {
        return {
          id,
          type: 'json',
          value: JSON.stringify(data),
        };
      } catch (e) {
        // Unserializable data (circular refs, functions, etc.) returns null placeholder
        return {
          id,
          type: 'json',
          value: null,
        };
      }
    }
    return this.add(data);
  }

  /**
   * Retrieves a stored object by ID and expands its properties one level deep.
   *
   * Returns an object with all own properties (including non-enumerable ones),
   * plus extra metadata like [[Prototype]], [[Entries]] for Set/Map, etc.
   *
   * @param id - The atom ID to retrieve
   * @returns Expanded property descriptors, or null if not found
   */
  public get(id: string) {
    const cacheData = this.store[id];
    const instanceId = this.instanceStore[id];
    if (!cacheData) return null;

    const result: Record<string, any> = {};
    const descriptors = Object.getOwnPropertyDescriptors(cacheData);
    Object.keys(descriptors).forEach((key) => {
      const desc = descriptors[key];
      if (hasOwnProperty(desc, 'value')) {
        desc.value = this.transformToAtom(desc.value);
      }
      result[key] = Atom.getAtomOverview({
        atomId: getRandomId(),
        instanceId,
        value: desc,
      });
    });
    const extraProps = this.addExtraProperty(id);
    return {
      ...result,
      ...extraProps,
    };
  }

  public getOrigin(id: string) {
    const value = this.store[id];
    if (!value) return null;
    return value;
  }

  /**
   * Stores a complex object and returns an atom reference to it.
   *
   * @param data - The object to store
   * @param insId - Instance ID for prototype objects (required when isPrototype returns true)
   *                to ensure getters are called with the correct `this` context
   * @returns An atom overview with the generated ID and semantic type name
   */
  public add(data: unknown, insId: string = ''): SpyAtom.Overview {
    const id = getRandomId();
    let instanceId = id;
    // Prototype objects must use the instance ID to bind getters correctly
    if (isPrototype(data)) {
      instanceId = insId;
    }
    this.store[id] = data;
    this.instanceStore[id] = instanceId;
    this.storeKeys.push(id);
    this.evictIfNeeded();
    const name = Atom.getSemanticValue(data);
    return Atom.getAtomOverview({ atomId: id, value: name, instanceId });
  }

  // FIFO 淘汰策略：当存储条目超过 maxStoreSize 时，移除最早添加的条目
  private evictIfNeeded() {
    while (this.storeKeys.length > this.maxStoreSize) {
      const oldestKey = this.storeKeys.shift()!;
      delete this.store[oldestKey];
      delete this.instanceStore[oldestKey];
    }
  }

  public static getAtomOverview({
    instanceId = '',
    atomId,
    value,
  }: {
    instanceId?: string;
    atomId: string;
    value: string | PropertyDescriptor;
  }): SpyAtom.Overview {
    const id = getRandomId();
    return {
      id,
      type: 'atom',
      __atomId: atomId,
      instanceId,
      value,
    };
  }

  public static getSemanticValue(data: any) {
    if (isPlainObject(data)) {
      return 'Object {...}';
    }
    if (isArray(data)) {
      return `Array (${data.length})`;
    }
    if (isModuleNamespace(data)) {
      return 'Module {...}';
    }
    return data?.constructor?.name ?? 'Object';
  }

  // 为特殊类型添加额外属性，使其在 Web 端能够正确展示
  // - 包装对象（String/Number/Boolean）：添加 [[PrimitiveValue]] 显示原始值
  // - Set/Map：添加 [[Entries]] 显示内容
  // - 原型链：添加 [[Prototype]] 支持向上追溯
  public addExtraProperty(id: string) {
    const data = this.store[id];
    const instanceId = this.instanceStore[id];
    const result: Record<string, any> = {};
    if (
      data instanceof String ||
      data instanceof Number ||
      data instanceof Boolean
    ) {
      result['[[PrimitiveValue]]'] = this.transformToAtom(data.valueOf());
    }
    if (data instanceof Set) {
      const entries: Record<string, any> = {};
      let index = 0;
      for (const v of data) {
        entries[index++] = v;
      }
      entries.size = data.size;
      result['[[Entries]]'] = this.transformToAtom(entries);
    }
    if (data instanceof Map) {
      const entries: Record<string, any> = {};
      let index = 0;
      for (const [k, v] of data.entries()) {
        entries[index++] = {
          key: k,
          value: v,
        };
      }
      entries.size = data.size;
      result['[[Entries]]'] = this.transformToAtom(entries);
    }
    /* c8 ignore next 3 */
    if (isArray(data) || isArrayLike(data)) {
      result.length = this.transformToAtom(data.length);
    }
    if (Object.getPrototypeOf(data) !== null) {
      result['[[Prototype]]'] = this.add(
        Object.getPrototypeOf(data),
        instanceId,
      );
    } else {
      // eslint-disable-next-line no-underscore-dangle
      result.___proto___ = this.transformToAtom(null);
    }
    return result;
  }
}

export const atom = new Atom();
