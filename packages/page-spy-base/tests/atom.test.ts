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
});
