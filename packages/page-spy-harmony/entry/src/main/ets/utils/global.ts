import { common } from '@kit.AbilityKit';

export class GlobalThis {
  private constructor() {
    throw new Error('Cannot init');
  }

  private static _uiContexts = new Map<string, common.UIAbilityContext>();
  public static setContext(key: string, value: common.UIAbilityContext): void {
    this._uiContexts.set(key, value);
  }
  public static getContext(key: string): common.UIAbilityContext | undefined {
    return this._uiContexts.get(key);
  }

  private static _data = new Map<string, object>();
  public static setValue(key: string, value: object) {
    this._data.set(key, value);
  }
  public static getValue(key: string): object {
    return this._data.get(key);
  }
}
