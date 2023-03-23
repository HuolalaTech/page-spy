/* eslint-disable no-restricted-syntax */
/* eslint-disable guard-for-in */
import type { SpyAtom } from 'types';
import {
  getRandomId,
  getValueType,
  hasOwnProperty,
  isArray,
  isArrayLike,
  isPlainObject,
  isPrototype,
  makePrimitiveValue,
} from './index';

class Atom {
  store: Record<string, any> = {};

  // { __atomId: instanceId }
  instanceStore: Record<string, string> = {};

  transformToAtom(data: any): any {
    const { value, ok } = makePrimitiveValue(data);
    if (ok) {
      return {
        id: getRandomId(),
        type: getValueType(data),
        value,
      };
    }
    return this.add(data);
  }

  add(data: any, insId: string = ''): SpyAtom.Overview {
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

  get(id: string) {
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

  /* c8 ignore start */
  getOrigin(id: string) {
    const value = this.store[id];
    if (!value) return null;
    return value;
  }
  /* c8 ignore stop */

  static getAtomOverview({
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

  static getSemanticValue(data: any) {
    if (isPlainObject(data)) {
      return 'Object {...}';
    }
    if (isArray(data)) {
      return `Array (${data.length})`;
    }
    const constructorName = data.constructor.name;
    return constructorName;
  }

  private addExtraProperty(id: string) {
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

export default new Atom();
