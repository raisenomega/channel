/**
 * HUB by Raisen — Bento Card: Agregar cliente (CTA onboarding).
 */
import type { Idioma } from "@/lib/i18n";
import { t } from "@/lib/i18n";

export function BentoAgregarCliente({ lang, onOpen }: {
  lang: Idioma;
  onOpen: () => void;
}) {
  return (
    <div className="bento-card bento-col-3">
      <div className="bento-title">
        <svg viewBox="0 0 20 20" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.6">
          <circle cx="10" cy="7" r="3" /><path d="M3 18c0-3 3-6 7-6s7 3 7 6" />
        </svg>
        <span>{t(lang, "dash.agregarCliente")}</span>
      </div>
      <p className="text-sm text-muted-foreground mb-2">
        {t(lang, "dash.agregarClienteDesc")}
      </p>
      <button
        type="button"
        className="chbar-chip on"
        style={{ fontSize: 13, padding: "7px 14px", alignSelf: "flex-start" }}
        onClick={onOpen}
      >
        <svg viewBox="0 0 16 16" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.5">
          <line x1="8" y1="2" x2="8" y2="14" /><line x1="2" y1="8" x2="14" y2="8" />
        </svg>
        <span>{t(lang, "onboard.title")}</span>
      </button>
    </div>
  );
}