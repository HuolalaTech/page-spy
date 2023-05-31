const initCookieStoreValue = (...args) => {
  if (args.length > 2) {
    throw new TypeError(`Expect 1 or 2 arguments, you passed ${args.length}.`);
  }
  const defaultValue = {
    name: '',
    value: '',
    domain: null,
    path: '',
    partitioned: false,
    secure: false,
    sameSite: 'none',
    expires: null,
  };
  if (typeof args[0] === 'string' && args.length === 2) {
    return {
      ...defaultValue,
      name: args[0],
      value: args[1],
    };
  }
  if (typeof args[0] === 'object') {
    return {
      ...defaultValue,
      ...args[0],
    };
  }
  throw new TypeError('Cannot handle the cookieStore arguments, please check.');
};

class CookieChangeEvent extends Event {
  changed = [];
  deleted = [];

  constructor(type, data) {
    super(type);
    this.changed = data.changed;
    this.deleted = data.deleted;
  }
}

class CookieStore extends EventTarget {
  mockStoreValue = [];

  async getAll() {
    // Mock value
    return this.mockStoreValue;
  }

  async set(name, value) {
    return new Promise((resolve) => {
      const storeValue = initCookieStoreValue(name, value);
      this.mockStoreValue.push(storeValue);
      this.dispatchEvent(
        new CookieChangeEvent('change', {
          changed: [storeValue],
          deleted: [],
        }),
      );
      resolve();
    });
  }

  async delete(name) {
    const result = [];
    const deleted = [];
    this.mockStoreValue.forEach((item) => {
      if (item.name === name) {
        deleted.push(item);
      } else {
        result.push(item);
      }
    });
    if (deleted.length === 0) return;
    this.mockStoreValue = result;
    this.dispatchEvent(
      new CookieChangeEvent('change', {
        changed: [],
        deleted,
      }),
    );
  }
}

window.cookieStore = new CookieStore();
