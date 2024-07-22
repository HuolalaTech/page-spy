import type { SpyAtom } from '../types';
import {
  getRandomId,
  getValueType,
  hasOwnProperty,
  isArray,
  isPlainObject,
  isPrototype,
  makePrimitiveValue,
  psLog,
} from './index';

class Atom {
  public store: Record<string, any> = {};

  public getStore() {
    return this.store;
  }

  public resetStore() {
    this.store = {};
  }

  // { __atomId: instanceId }
  public instanceStore: Record<string, string> = {};

  public getInstanceStore() {
    return this.instanceStore;
  }

  public resetInstanceStore() {
    this.instanceStore = {};
  }

  public transformToAtom(data: any, serializeData = false): any {
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
        // type === 'json' && value === null 作为无法序列化数据时的硬编码
        return {
          id,
          type: 'json',
          value: null,
        };
      }
    }
    return this.add(data);
  }

  public get(id: string) {
    const cacheData = this.store[id];
    const instanceId = this.instanceStore[id];
    if (!cacheData) return null;

    const result: Record<string, any> = {};
    Object.keys(cacheData).forEach((key) => {
      const desc = Object.getOwnPropertyDescriptor(cacheData, key);
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

  public add(data: any, insId: string = ''): SpyAtom.Overview {
    const id = getRandomId();
    let instanceId = id;
    // must provide the instance id if the `isPrototype(data)` return true,
    // or else will occur panic when access the property along the proto chain
    if (isPrototype(data)) {
      instanceId = insId;
    }
    this.store[id] = data;
    this.instanceStore[id] = instanceId;
    const name = Atom.getSemanticValue(data);
    return Atom.getAtomOverview({ atomId: id, value: name, instanceId });
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
    const constructorName = data.constructor.name;
    return constructorName;
  }

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
    // The behavior is weird: <class>.prototype instanceof <class> === true
    if (data !== Set.prototype && data instanceof Set) {
      const entries: Record<string, any> = {};
      let index = 0;
      for (const v of data) {
        entries[index++] = v;
      }
      entries.size = data.size;
      result['[[Entries]]'] = this.transformToAtom(entries);
    }
    if (data !== Map.prototype && data instanceof Map) {
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
    if (isArray(data)) {
      result.length = this.transformToAtom(data.length);
    }
    if (Object.getPrototypeOf(data) !== null) {
      result['[[Prototype]]'] = this.add(
        Object.getPrototypeOf(data),
        instanceId,
      );
    } else {
      result.___proto___ = this.transformToAtom(null);
    }
    return result;
  }
}

export default new Atom();
