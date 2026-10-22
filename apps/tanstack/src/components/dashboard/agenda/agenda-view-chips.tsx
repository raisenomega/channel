/**
 * HUB by Raisen — Chips de vista de la Agenda (Mes / Semana / Dia) + Hoy. C4 <=75.
 */
import type { Idioma } from "@/lib/i18n";
import { t } from "@/lib/i18n";

export type AgendaView = "month" | "week" | "day";
const VIEWS: AgendaView[] = ["month", "week", "day"];

export function AgendaViewChips({ lang, accent, view, onView, onToday }: {
  lang: Idioma;
  accent: string;
  view: AgendaView;
  onView: (v: AgendaView) => void;
  onToday: () => void;
}) {
  return (
    <div className="flex items-center gap-1.5">
      {VIEWS.map((v) => (
        <button
          key={v}
          type="button"
          onClick={() => onView(v)}
          className={"chip" + (view === v ? " active" : "")}
          style={view === v ? { color: `hsl(${accent})`, borderColor: `hsl(${accent})` } : undefined}
        >
          {t(lang, "agenda.view." + v)}
        </button>
      ))}
      <button type="button" className="chip" onClick={onToday}>{t(lang, "agenda.today")}</button>
    </div>
  );
}
