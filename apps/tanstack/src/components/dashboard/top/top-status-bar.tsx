/**
 * HUB by Raisen — Barra de chips de estado, misma medida que "Crear negocio" (glass-card p-3.5).
 * Abierto/Pendiente/Diferido/Resuelta + SLA + Limpiar. Reusa los MISMOS handlers del inbox (no inventa
 * estado). Letra text-xs (legible) + chips que llenan bien la barra, sin ruido visual. C4 <=75.
 */
import { t, type Idioma } from "@/lib/i18n";
import { ESTADOS } from "@/routes/inbox/inbox-mappers";

const BASE = "rounded-full border px-2.5 py-1 leading-none transition";
const ON = " border-primary text-primary";
const OFF = " border-border/50 text-muted-foreground hover:text-foreground";

export function TopStatusBar({ lang, filtroEstado, filtroSLA, onEstado, onSLA, onClean }: {
  lang: Idioma;
  filtroEstado: string | null;
  filtroSLA: boolean | null;
  onEstado: (e: string) => void;
  onSLA: () => void;
  onClean: () => void;
}) {
  return (
    <div className="bento-col-3 flex flex-wrap items-center justify-center gap-1.5 rounded-2xl glass-card p-3.5 text-xs font-semibold">
      {ESTADOS.map((e) => (
        <button key={e} type="button" onClick={() => onEstado(e)} className={BASE + (e === filtroEstado ? ON : OFF)}>
          {t(lang, "filtro.estado." + e)}
        </button>
      ))}
      <button type="button" onClick={onSLA} className={BASE + (filtroSLA === true ? ON : OFF)}>
        {t(lang, "inbox.filtros.sla")}
      </button>
      <button type="button" onClick={onClean} className={BASE + OFF}>
        {t(lang, "filtro.clean")}
      </button>
    </div>
  );
}
