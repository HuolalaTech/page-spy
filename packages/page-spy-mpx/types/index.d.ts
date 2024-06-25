import {
  PageSpyBase,
  SpyMP,
  PageSpyPlugin,
} from '@huolala-tech/page-spy-types';

interface PageSpyConstructor {
  new (config: SpyMP.MPInitConfig): PageSpyBase;
  instance: PageSpyBase | null;
  registerPlugin(plugin: PageSpyPlugin): void;
}

declare const PageSpy: PageSpyConstructor;

export default PageSpy;
