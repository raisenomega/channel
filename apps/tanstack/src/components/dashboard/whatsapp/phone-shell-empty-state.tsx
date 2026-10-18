/**
 * HUB by Raisen — R-6-1 (Compuerta #70): empty-state honesto del phone-shell post-conexion WhatsApp.
 * Mensaje transparente sobre la limitacion de Meta (no hay historial previo). R-6-2: CTA de import
 * .txt detras de feature flag (default OFF). Desaparece solo cuando llegan chats (R-6-3 realtime=P). C4 <=75.
 */
import type { Idioma } from "@/lib/i18n";
import { t } from "@/lib/i18n";

export function PhoneShellEmptyState({ language = "es", importEnabled = false }: {
  language?: Idioma;
  importEnabled?: boolean;
}) {
  return (
    <div data-testid="phone-shell-empty" className="wa-chats flex flex-col items-center justify-center gap-3 p-5 text-center">
      <p className="rounded-xl glass-card p-3 text-xs leading-relaxed text-gray-600">{t(language, "phoneShell.noHistory")}</p>
      {importEnabled ? (
        <button type="button" className="rounded-lg border border-border/50 px-3 py-1.5 text-xs font-semibold text-foreground">
          {t(language, "phoneShell.importBtn")}
        </button>
      ) : null}
    </div>
  );
}
