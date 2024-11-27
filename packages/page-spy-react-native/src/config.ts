import { ConfigBase } from '@huolala-tech/page-spy-base/dist/config';
import { InitConfigBase } from '@huolala-tech/page-spy-types';

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

export class Config extends ConfigBase<InitConfig> {
  protected privateKeys: (keyof InitConfig)[] = ['secret'];

  // I need to use generic type on this method, so it can't be static
  protected defaultConfig() {
    return {
      api: '',
      project: 'default',
      title: '',
      enableSSL: true,
      disabledPlugins: [],
      useSecret: false,
      secret: '',
      messageCapacity: 0,
      serializeData: false,
      dataProcessor: {},
    };
  }
}
