import { PageSpyBase, SpyMP } from '@huolala-tech/page-spy-types';

interface PageSpyConstructor {
  new (config: SpyMP.MPInitConfig): PageSpyBase;
  instance: PageSpyBase | null;
}

declare const PageSpy: PageSpyConstructor;

export default PageSpy;
