export abstract class ConfigBase<C extends Record<string, any>> {
  protected value: Required<C>;

  // eslint disable: have to use generic type here
  /* eslint-disable-next-line class-methods-use-this */
  protected defaultConfig() {
    return {} as Required<C>;
  }

  constructor() {
    this.value = this.defaultConfig();
  }

  public mergeConfig = (userCfg: C): Required<C> => {
    this.value = {
      /* c8 ignore next */
      ...this.defaultConfig(),
      ...userCfg,
    };
    return this.value;
  };

  get() {
    return this.value;
  }
}
