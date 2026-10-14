import type { Idioma } from "@/lib/i18n";

/** Formatea una fecha ISO al locale del usuario. */
export function formatDate(iso: string | null, lang: Idioma): string {
  if (!iso) return "\u2014";
  try {
    return new Date(iso).toLocaleDateString(lang === "es" ? "es" : "en", {
      year: "numeric", month: "short", day: "numeric",
    });
  } catch {
    return "\u2014";
  }
}

export type { Idioma };