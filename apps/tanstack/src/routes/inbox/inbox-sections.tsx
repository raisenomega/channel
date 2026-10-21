/**
 * HUB by Raisen — Barra de filtros del dashboard /inbox.
 */
import type { Idioma } from "@/lib/i18n";
import { t } from "@/lib/i18n";
import { AlertBadge } from "@/components/ui/alert-badge";
import { ESTADOS } from "./inbox-mappers";

export function FiltersBar({ language, canalesActivos, estadoCounts, slaCount, filtroEstado, filtroSLA, onEstado, onSLA, onClean, onCanalNav }: {
  language: Idioma;
  canalesActivos: readonly string[];
  estadoCounts: Record<string, number>;
  slaCount: number;
  filtroEstado: string | null;
  filtroSLA: boolean | null;
  onEstado: (e: string) => void;
  onSLA: () => void;
  onClean: () => void;
  onCanalNav: (c: string) => void;
}) {
  return (
    <div className="bento-card bento-col-12 mt-4">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{t(language, "inbox.channels")}:</span>
        {(canalesActivos.length ? canalesActivos : ["whatsapp", "email", "instagram"]).map((c) => (
          <button key={c} type="button" className="chip" onClick={() => onCanalNav(c)}>
            <span className="chip-name">{t(language, "canal." + c)}</span>
            <AlertBadge keyName={"channel:" + c} />
          </button>
        ))}
        {ESTADOS.map((e) => (
          <button key={e} type="button" className={"chip" + (e === filtroEstado ? " active" : "")} onClick={() => onEstado(e)}>
            <span className="chip-name">{t(language, "filtro.estado." + e)}</span>
            <AlertBadge count={estadoCounts[e] ?? 0} />
          </button>
        ))}
        <button type="button" className={"chip" + (filtroSLA === true ? " active" : "")} onClick={onSLA}>
          <span className="chip-name">{filtroSLA === true ? t(language, "filtro.sla.violated") : t(language, "inbox.filtros.sla")}</span>
          <AlertBadge count={slaCount} />
        </button>
        <button type="button" className="chip" onClick={onClean}>
          <span className="chip-name text-muted-foreground">{t(language, "filtro.clean")}</span>
        </button>
      </div>
    </div>
  );
}