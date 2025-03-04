import { isCN, psLog } from './utils';

export type Lang = 'zh' | 'en';
export type Locales<T extends string> = Record<Lang, Record<T, string>>;

interface TranslationOptions<T extends string> {
  locales: Locales<T>;
  defaultLang?: Lang;
}

const systemLang = isCN() ? 'zh' : 'en';

export class Translation<T extends string> {
  private locales: Locales<T>;

  private currentLang: Lang;

  constructor(options: TranslationOptions<T>) {
    const { locales, defaultLang = systemLang } = options;

    if (!locales || Object.keys(locales).length === 0) {
      throw new Error('[PageSpy] Locales cannot be empty');
    }

    if (!locales[defaultLang]) {
      throw new Error(`[PageSpy] Language "${defaultLang}" not found`);
    }

    this.locales = locales;
    this.currentLang = defaultLang;
  }

  // key 的类型变为 T，提供具体键名提示
  t(key: T, lang?: Lang): string {
    const targetLang = lang || this.currentLang;
    const locale = this.locales[targetLang];

    if (!locale) {
      psLog.warn(`Language '${targetLang}' not found, falling back to default`);
      return key;
    }

    return locale[key] || key;
  }

  setLang(lang: Lang): void {
    if (!this.locales[lang]) {
      psLog.error(`Language '${lang}' is not supported`);
      return;
    }
    this.currentLang = lang;
  }

  getCurrentLang(): string {
    return this.currentLang;
  }

  getSupportedLangs(): string[] {
    return Object.keys(this.locales);
  }
}
