import { Language } from "./locale.vo.ts";

export type TranslationKey = string;

export interface TranslationProvider {
  readonly language: Language;
  translate(key: TranslationKey, params?: Readonly<Record<string, string>>): string;
}

export type TranslationMap = Readonly<Record<Language, Readonly<Record<TranslationKey, string>>>>;

export const crearTranslationProvider = (
  lang: Language,
  translations: TranslationMap,
): TranslationProvider => ({
  language: lang,
  translate: (key: TranslationKey, params?: Readonly<Record<string, string>>): string => {
    const langMap = translations[lang] ?? translations["en"];
    let text = langMap[key] ?? key;
    if (params) {
      for (const [k, v] of Object.entries(params)) {
        text = text.replace(`{${k}}`, v);
      }
    }
    return text;
  },
});