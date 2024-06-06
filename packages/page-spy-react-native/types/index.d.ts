import type {
  PageSpyBase,
  PageSpyPlugin,
  InitConfigBase,
} from '@huolala-tech/page-spy-types';

type InternalPlugins =
  | 'ConsolePlugin'
  | 'ErrorPlugin'
  | 'NetworkPlugin'
  | 'SystemPlugin';
export interface InitConfig extends InitConfigBase {
  /**
   * All internal plugins are carried with PageSpy by default out of the box.
   * You can disable some plugins as needed.
   */
  disabledPlugins?: (InternalPlugins | string)[];
}

interface PageSpyConstructor {
  new (config: InitConfig): PageSpyBase;
  instance: PageSpyBase | null;
  registerPlugin(plugin: PageSpyPlugin): void;
}

declare const PageSpy: PageSpyConstructor;

export default PageSpy;
