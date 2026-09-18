import { psLog, Translation } from 'page-spy-base/src';

type TranslationKey = 'greeting' | 'onlyEnglish';

const createLocales = () => ({
  en: { greeting: 'Hello', onlyEnglish: 'English only' },
  zh: { greeting: '你好', onlyEnglish: '仅英文' },
});

describe('Translation', () => {
  it('rejects empty locales and a missing default language', () => {
    const emptyLocales = createLocales();
    Reflect.deleteProperty(emptyLocales, 'en');
    Reflect.deleteProperty(emptyLocales, 'zh');

    expect(() => new Translation({ locales: emptyLocales })).toThrow(
      'Locales cannot be empty',
    );
    const locales = createLocales();

    expect(() => new Translation({ locales, defaultLang: 'zh' })).not.toThrow();
    Reflect.deleteProperty(locales, 'zh');
    expect(() => new Translation({ locales, defaultLang: 'zh' })).toThrow(
      'Language "zh" not found',
    );
  });

  it('translates using the current language and falls back to the key', () => {
    const locales = createLocales();
    const translation = new Translation<TranslationKey>({
      locales,
      defaultLang: 'en',
    });

    expect(translation.t('greeting')).toBe('Hello');
    expect(translation.t('greeting', 'zh')).toBe('你好');
    Reflect.deleteProperty(locales.zh, 'onlyEnglish');
    expect(translation.t('onlyEnglish', 'zh')).toBe('onlyEnglish');
  });

  it('warns and returns the key when the requested locale is unavailable', () => {
    const warn = jest.spyOn(psLog, 'warn').mockImplementation();
    const locales = createLocales();
    const translation = new Translation<TranslationKey>({
      locales,
      defaultLang: 'en',
    });
    Reflect.deleteProperty(locales, 'zh');

    expect(translation.t('greeting', 'zh')).toBe('greeting');
    expect(warn).toHaveBeenCalledWith(
      "Language 'zh' not found, falling back to default",
    );

    warn.mockRestore();
  });

  it('changes to a supported language and preserves the current language otherwise', () => {
    const error = jest.spyOn(psLog, 'error').mockImplementation();
    const locales = createLocales();
    const translation = new Translation<TranslationKey>({
      locales,
      defaultLang: 'en',
    });

    translation.setLang('zh');
    expect(translation.getCurrentLang()).toBe('zh');
    expect(translation.getSupportedLangs()).toEqual(['en', 'zh']);

    Reflect.deleteProperty(locales, 'en');
    translation.setLang('en');
    expect(translation.getCurrentLang()).toBe('zh');
    expect(error).toHaveBeenCalledWith("Language 'en' is not supported");

    error.mockRestore();
  });
});
