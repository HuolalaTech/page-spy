import {
  InitConfigBase,
  PageSpyBase,
  PageSpyPlugin,
  PageSpyPluginLifecycle,
  PageSpyPluginLifecycleArgs,
} from '@huolala-tech/page-spy-types';

interface PageSpyBrowser extends PageSpyBase {
  root: HTMLElement | null;
  config: Required<InitConfig> | null;
  render(): void;
  triggerPlugins<T extends PageSpyPluginLifecycle>(
    lifecycle: T,
    ...args: PageSpyPluginLifecycleArgs<T>
  ): void;
}

interface PageSpyConstructor {
  new (config?: InitConfig): PageSpyBrowser;
  instance: PageSpyBrowser | null;
  registerPlugin(plugin: PageSpyPlugin): void;
}

declare const PageSpy: PageSpyConstructor;

export default PageSpy;
