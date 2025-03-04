import { Translation } from '@huolala-tech/page-spy-base';

const locales = {
  zh: {
    copyLink: '复制在线调试链接',
    copied: '复制成功',
    copyFailed: '复制失败',
  },
  en: {
    copyLink: 'Copy online debug link',
    copied: 'Copied',
    copyFailed: 'Copy failed',
  },
};

export const i18n = new Translation({
  locales,
});
