import { atom } from 'page-spy-base/src';

// jest.mock('base/src/utils/atom.ts');
beforeEach(() => {
  atom.resetStore();
  atom.resetInstanceStore();
});

describe('Atom', () => {
  it('Data would be cacehed after call atom.add([data])', () => {
    const data = {};
    atom.add(data);
    expect(Object.keys(atom.getStore()).length).toBe(1);
    expect(Object.keys(atom.getInstanceStore()).length).toBe(1);
    expect(Object.values(atom.getStore())[0]).toBe(data);
  });
  it('Self-reference data is ok', () => {
    atom.add(window);
    expect(Object.keys(atom.getStore()).length).toBe(1);
    expect(Object.keys(atom.getInstanceStore()).length).toBe(1);
    expect(Object.values(atom.getStore())[0]).toBe(window);
  });
});

describe('Atom.get', () => {
  it('All key of origin data must be reserved', () => {
    const data = {
      num: 1,
      bool: true,
      str: 'Hello',
      list: [1, true, 'Hello', [1, true, 'Hello']],
      store: {
        num: 1,
        bool: true,
        str: 'Hello',
        list: [1, true, 'Hello', [1, true, 'Hello']],
      },
      func: function test() {},
      arrowFunc: () => {},
    };
    atom.add(data);
    const atomId = Object.keys(atom.getStore())[0];
    const atomNode = atom.get(atomId);
    Object.keys(data).forEach((key) => {
      expect(atomNode).toHaveProperty(key);
    });
  });
});

describe('Atom.addExtraProperty', () => {
  it('[[PrimitiveValue]] prop added to `new String` data', () => {
    const data = new String('Hello, PageSpy');
    atom.add(data);
    const atomId = Object.keys(atom.getStore())[0];
    const atomNode = atom.get(atomId);
    const atomNodeValue = atomNode!['[[PrimitiveValue]]'];
    expect(atomNode).not.toBeNull();
    expect(atomNodeValue).not.toBeNull();
    expect(atomNodeValue.value).toBe(data.valueOf());
  });
  it('[[PrimitiveValue]] prop added to `new Number` data', () => {
    const data = new Number(520);
    atom.add(data);
    const atomId = Object.keys(atom.getStore())[0];
    const atomNode = atom.get(atomId);
    const atomNodeValue = atomNode!['[[PrimitiveValue]]'];
    expect(atomNode).not.toBeNull();
    expect(atomNodeValue).not.toBeNull();
    expect(atomNodeValue.value).toBe(data.valueOf());
  });
  it('[[PrimitiveValue]] prop added to `new Boolean` data', () => {
    const data = new Boolean(true);
    atom.add(data);
    const atomId = Object.keys(atom.getStore())[0];
    const atomNode = atom.get(atomId);
    const atomNodeValue = atomNode!['[[PrimitiveValue]]'];
    expect(atomNode).not.toBeNull();
    expect(atomNodeValue).not.toBeNull();
    expect(atomNodeValue.value).toBe(data.valueOf());
  });
  it('[[Entries]] prop added to `new Set` data', () => {
    const data = new Set([1, 2, 3, 1]);
    atom.add(data);
    const atomId = Object.keys(atom.getStore())[0];
    const atomNode = atom.get(atomId);
    const atomNodeValue = atomNode!['[[Entries]]'];
    expect(atomNode).not.toBeNull();
    expect(atomNodeValue).not.toBeNull();
  });
  it('[[Entries]] prop added to `new Map` data', () => {
    const data = new Map([[window, document]]);
    atom.add(data);
    const atomId = Object.keys(atom.getStore())[0];
    const atomNode = atom.get(atomId);
    const atomNodeValue = atomNode!['[[Entries]]'];
    expect(atomNode).not.toBeNull();
    expect(atomNodeValue).not.toBeNull();
  });
  it('[[Prototype]] prop added to prototype data except `Object.prototype` type', () => {
    const data = new Number(123);
    atom.add(data);
    const atomId = Object.keys(atom.getStore())[0];
    const atomNode = atom.get(atomId);
    const atomNodeValue = atomNode!['[[Prototype]]'];
    expect(atomNode).not.toBeNull();
    expect(atomNodeValue).not.toBeNull();
  });
  it('___proto___ prop added to `Object.prototype` data', () => {
    const data = Object.prototype;
    atom.add(data);
    const atomId = Object.keys(atom.getStore())[0];
    const atomNode = atom.get(atomId);
    const atomNodeValue = atomNode!['___proto___'];
    expect(atomNode).not.toBeNull();
    expect(atomNodeValue).not.toBeNull();
  });
});

describe('transformToAtom: convert data to be descriptive atom object', () => {
  it("Primitive value won't be transformed to atom", () => {
    expect(atom.transformToAtom(undefined).type).not.toBe('atom');
    expect(atom.transformToAtom(0).type).not.toBe('atom');
    expect(atom.transformToAtom(Math.pow).type).not.toBe('atom');
    expect(atom.transformToAtom(Symbol('foo')).type).not.toBe('atom');
    expect(atom.transformToAtom(new Error()).type).not.toBe('atom');
  });

  it('Complex value would transform to atom', () => {
    expect(atom.transformToAtom({}).type).toBe('atom');
    expect(atom.transformToAtom([]).type).toBe('atom');
    expect(atom.transformToAtom(new String()).type).toBe('atom');
    expect(atom.transformToAtom(new Number()).type).toBe('atom');
    expect(atom.transformToAtom(new Boolean()).type).toBe('atom');
    expect(atom.transformToAtom(Object.prototype).type).toBe('atom');
  });

  it('Serializes complex values inline when serializeData is enabled', () => {
    const result = atom.transformToAtom({ answer: 42 }, true);

    expect(result).toMatchObject({
      type: 'json',
      value: '{"answer":42}',
    });
  });

  it('Uses a null placeholder when an inline value is not serializable', () => {
    const circular: Record<string, unknown> = {};
    circular.self = circular;

    expect(atom.transformToAtom(circular, true)).toMatchObject({
      type: 'json',
      value: null,
    });
  });
});

describe('Atom store eviction', () => {
  it('Store evicts oldest entries when exceeding maxStoreSize', () => {
    const originalMax = atom.maxStoreSize;
    atom.maxStoreSize = 5;

    const ids: string[] = [];
    for (let i = 0; i < 8; i++) {
      const overview = atom.add({ index: i });
      ids.push(overview.__atomId!);
    }

    // Only the latest 5 entries should remain
    expect(Object.keys(atom.getStore()).length).toBe(5);
    expect(Object.keys(atom.getInstanceStore()).length).toBe(5);

    // The first 3 (oldest) should be evicted
    expect(atom.getStore()[ids[0]]).toBeUndefined();
    expect(atom.getStore()[ids[1]]).toBeUndefined();
    expect(atom.getStore()[ids[2]]).toBeUndefined();

    // The last 5 should still exist
    for (let i = 3; i < 8; i++) {
      expect(atom.getStore()[ids[i]]).toBeDefined();
    }

    atom.maxStoreSize = originalMax;
  });

  it('keeps the default store bounded while handling more than 5,000 entries', () => {
    const entries = Array.from({ length: 5001 }, (_, index) =>
      atom.add({ index }),
    );
    const firstId = entries[0].__atomId;
    const latestId = entries[entries.length - 1].__atomId;

    if (!firstId || !latestId) {
      throw new Error('Atom entries must include their storage IDs');
    }

    expect(Object.keys(atom.getStore())).toHaveLength(atom.maxStoreSize);
    expect(atom.getOrigin(firstId)).toBeNull();
    expect(atom.getOrigin(latestId)).toEqual({ index: 5000 });
  });

  it('resetStore clears both store and internal key list', () => {
    atom.add({ a: 1 });
    atom.add({ b: 2 });
    expect(Object.keys(atom.getStore()).length).toBe(2);

    atom.resetStore();
    expect(Object.keys(atom.getStore()).length).toBe(0);

    // After reset, adding new items should work correctly
    atom.add({ c: 3 });
    expect(Object.keys(atom.getStore()).length).toBe(1);
  });
});

describe('Atom.getOrigin', () => {
  it('Returns original data by atomId', () => {
    const data = { foo: 'bar', nested: { value: 123 } };
    const overview = atom.add(data);
    const atomId = overview.__atomId!;

    const origin = atom.getOrigin(atomId);
    expect(origin).toBe(data);
    expect(origin.foo).toBe('bar');
    expect(origin.nested.value).toBe(123);
  });

  it('Returns null for non-existent atomId', () => {
    const result = atom.getOrigin('non-existent-id');
    expect(result).toBeNull();
  });

  it('Returns null after store is reset', () => {
    const overview = atom.add({ test: 'data' });
    const atomId = overview.__atomId!;

    atom.resetStore();
    const result = atom.getOrigin(atomId);
    expect(result).toBeNull();
  });
});
