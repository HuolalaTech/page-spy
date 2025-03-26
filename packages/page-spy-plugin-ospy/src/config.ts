import { CacheMessageItem } from '@huolala-tech/page-spy-plugin-data-harbor/dist/types/harbor/base';
import { Lang } from '@huolala-tech/page-spy-base';
import pageSpyLogo from './assets/logo.svg';

export interface Config {
  lang: Lang | null;
  title: string;
  /**
   * Online source: 'https://example.com/xxx.jpg'
   * Data url: 'data:image/png;base64,xxxx...'
   * Relative source: '../xxx.jpg'
   */
  logo: string;
  primaryColor: string;
  autoRender: boolean;
  exportButtonText: string | null;
  onExportButtonClick: ((data: CacheMessageItem[]) => void) | null;
}

export const defaultConfig: Config = {
  lang: null,
  title: 'O-Spy',
  logo: pageSpyLogo,
  primaryColor: 'hsl(270, 100%, 55%)',
  autoRender: true,
  exportButtonText: null,
  onExportButtonClick: null,
};
