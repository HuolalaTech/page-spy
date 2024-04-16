export abstract class ConfigBase<C extends Record<string, any>> {
  protected value: Required<C>;

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
