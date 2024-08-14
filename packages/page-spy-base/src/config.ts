export abstract class ConfigBase<C extends Record<string, any>> {
  protected abstract privateKeys: (keyof C)[];

  protected value: Required<C>;

  protected defaultConfig() {
    return {} as Required<C>;
  }

  constructor() {
    this.value = this.defaultConfig();
  }

  public mergeConfig = (userCfg: C): Required<C> => {
    const excludePrivate = Object.entries(userCfg).reduce((acc, [key, val]) => {
      if (this.privateKeys.includes(key)) return acc;
      acc[key as keyof C] = val;
      return acc;
    }, {} as C);
    this.value = {
      /* c8 ignore next */
      ...this.defaultConfig(),
      ...excludePrivate,
    };
    return this.value;
  };

  get() {
    return this.value;
  }

  set<T extends keyof C>(key: T, val: C[T]) {
    this.value[key] = val;
  }
}
