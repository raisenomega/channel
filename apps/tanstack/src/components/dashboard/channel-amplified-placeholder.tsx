/**
 * HUB by Raisen — Placeholder para la "conversación ampliada" cuando no se
 * inyecta contenido propio en la columna derecha (.cf-content).
 */
import { t, type Idioma } from "@/lib/i18n";

export function ChatAmplified({ lang }: { lang: Idioma }) {
  return (
    <div className="cf-conv-placeholder">
      <span className="cf-conv-title">{t(lang, "cf.convTitle")}</span>
      <span className="cf-conv-sub">{t(lang, "cf.convSub")}</span>
    </div>
  );
}