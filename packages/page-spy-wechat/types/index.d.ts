import type {
  MPInitConfig as InitConfig,
  PageSpyBase,
  PageSpyPlugin,
} from '@huolala-tech/page-spy-types/lib';

export { InitConfig };
interface PageSpyConstructor {
  new (config: InitConfig): PageSpyBase;
  instance: PageSpyBase | null;
  registerPlugin(plugin: PageSpyPlugin): void;
}

declare const PageSpy: PageSpyConstructor;

export default PageSpy;
