import type {
  MPInitConfig as InitConfig,
  PageSpyBase,
} from '@huolala-tech/page-spy-types/lib';

export { InitConfig };
interface PageSpyConstructor {
  new (config: InitConfig): PageSpyBase;
  instance: PageSpyBase | null;
  abort(): void;
}

declare const PageSpy: PageSpyConstructor;

export default PageSpy;
