import {
  InitConfigBase,
  OnInitParams,
  PageSpyPlugin,
} from '@huolala-tech/page-spy-types';

export default class SpyRRWebPlugin implements PageSpyPlugin {
  public name = 'SpyRRWebPlugin';

  public static hasInited = false;

  public onInit({ socketStore, config }: OnInitParams) {}
}
