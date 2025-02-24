import { CacheMessageItem } from '@huolala-tech/page-spy-plugin-data-harbor/dist/types/harbor/base';
import pageSpyLogo from './assets/logo.svg';
import { t } from './utils/locale';

export interface Config {
  title: string;
  /**
   * Online source: 'https://example.com/xxx.jpg'
   * Data url: 'data:image/png;base64,xxxx...'
   * Relative source: '../xxx.jpg'
   */
  logo: string;
  primaryColor: string;
  autoRender: boolean;
  exportButtonText: string;
  onExportButtonClick: ((data: CacheMessageItem[]) => void) | null;
}

export const defaultConfig: Config = {
  title: 'O-Spy',
  logo: pageSpyLogo,
  primaryColor: '#8434E9',
  autoRender: true,
  exportButtonText: t.export,
  onExportButtonClick: null,
};
