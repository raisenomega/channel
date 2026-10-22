/**
 * HUB by Raisen — Fila de la plantilla PDF activa en la pagina de Cotizaciones: muestra el estilo
 * elegido (swatch + nombre) y el estado "En uso"; al hacer clic reabre el editor. El estilo se lee
 * via get_branding (misma fuente que persiste). Comparte cache-key con el editor para refrescar. C4 <=75.
 */
import { useQuery } from "@tanstack/react-query";
import type { Idioma } from "@/lib/i18n";
import { t } from "@/lib/i18n";
import { fetchBusinessInfo } from "./pdf/pdf-business-info";
import { styleOf } from "./pdf/pdf-styles";

export function TemplateRow({ lang, onOpen }: { lang: Idioma; onOpen: () => void }) {
  const q = useQuery({ queryKey: ["pdf-biz", "row"], queryFn: () => fetchBusinessInfo("row") });
  const style = styleOf(q.data?.style);
  return (
    <button
      type="button"
      onClick={onOpen}
      className="glass-card flex w-full items-center justify-between gap-3 px-4 py-3 text-left transition hover:border-primary/60"
    >
      <div className="flex items-center gap-3">
        <span className="h-9 w-9 shrink-0 rounded-md border border-border/50" style={{ background: style.accent }} aria-hidden />
        <div>
          <div className="text-sm font-bold text-foreground">{t(lang, "quotes.tpl.active")}</div>
          <div className="text-xs text-muted-foreground">{t(lang, "quotes.style." + style.id)}</div>
        </div>
      </div>
      <span className="chip shrink-0 bg-green-500/15 text-xs font-bold text-green-600 dark:text-green-400">
        {t(lang, "quotes.tpl.inUse")}
      </span>
    </button>
  );
}
