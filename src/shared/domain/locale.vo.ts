export type Language = "es" | "en";

export const LANGUAGES: readonly Language[] = Object.freeze(["es", "en"]);

export const isValidLanguage = (lang: string): lang is Language =>
  LANGUAGES.includes(lang as Language);

export type Locale = {
  readonly language: Language;
  readonly timezone: string;
  readonly country: string;
};

export const crearLocale = (
  lang: string,
  timezone: string,
  country: string,
): Result<Locale, LocaleError> => {
  if (!isValidLanguage(lang)) {
    return err({ kind: "invalid_language", value: lang });
  }
  if (!timezone || timezone.trim().length === 0) {
    return err({ kind: "invalid_timezone" });
  }
  return ok(Object.freeze({ language: lang as Language, timezone, country }));
};

export type LocaleError =
  | { readonly kind: "invalid_language"; readonly value: string }
  | { readonly kind: "invalid_timezone" };

import { Result, err, ok } from "./result.ts";