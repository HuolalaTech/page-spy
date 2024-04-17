import {
  PageSpyBase,
  SpyMP,
  PageSpyPlugin,
} from '@huolala-tech/page-spy-types';

declare interface MPTaroInitConfig extends SpyMP.MPInitConfig {
  /**
   * The Taro global object.
   */
  taro: any;
}

declare interface PageSpyConstructor {
  new (config: MPTaroInitConfig): PageSpyBase;
  instance: PageSpyBase | null;
  registerPlugin(plugin: PageSpyPlugin): void;
}

declare const PageSpy: PageSpyConstructor;

export default PageSpy;
