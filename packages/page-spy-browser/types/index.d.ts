import { InitConfigBase, PageSpyBase } from '@huolala-tech/page-spy-types';

export interface InitConfig extends InitConfigBase {
  /**
   * Client host. Form example, "https://example.com".
   */
  clientOrigin?: string;
  /**
   * Indicate whether auto render the widget on the bottom-left corner.
   * You can manually render later by calling "window.$pageSpy.render()"
   * if passed false.
   * @default true
   */
  autoRender?: boolean;
}

interface PageSpyBrowser extends PageSpyBase {
  root: HTMLElement | null;
  config: Required<InitConfig> | null;
}

interface PageSpyConstructor {
  new (config: InitConfig): PageSpyBrowser;
  instance: PageSpyBrowser | null;
  render(): void;
}

declare const PageSpy: PageSpyConstructor;

export default PageSpy;
