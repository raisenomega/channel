import { TRANSLATIONS_ES } from "./translations-es.ts";
import { TRANSLATIONS_ES_2 } from "./translations-es-2.ts";
import { TRANSLATIONS_ES_3 } from "./translations-es-3.ts";
import { TRANSLATIONS_EN } from "./translations-en.ts";
import { TRANSLATIONS_EN_2 } from "./translations-en-2.ts";
import { TRANSLATIONS_EN_3 } from "./translations-en-3.ts";
import { TranslationMap } from "./translation-provider.ts";

export const TRANSLATIONS: TranslationMap = Object.freeze({
  es: Object.freeze({ ...TRANSLATIONS_ES, ...TRANSLATIONS_ES_2, ...TRANSLATIONS_ES_3 }),
  en: Object.freeze({ ...TRANSLATIONS_EN, ...TRANSLATIONS_EN_2, ...TRANSLATIONS_EN_3 }),
});