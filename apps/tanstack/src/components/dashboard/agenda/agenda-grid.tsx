/**
 * HUB by Raisen — Vista MES: label + flechas de mes + grid 6x7 de celdas. C4 <=75.
 */
import type { Idioma } from "@/lib/i18n";
import { t } from "@/lib/i18n";
import { AgendaDayCell } from "./agenda-day-cell";
import { weekdayShort, monthLabel, monthRange } from "./agenda-dates";
import type { RowAppointment } from "./agenda-types";

export function AgendaMonth({ lang, accent, year, month, grouped, onDay, onPick, onMove }: {
  lang: Idioma;
  accent: string;
  year: number;
  month: number;
  grouped: Map<string, RowAppointment[]>;
  onDay: (d: Date) => void;
  onPick: (a: RowAppointment) => void;
  onMove: (delta: number) => void;
}) {
  const { gridStart } = monthRange(year, month);
  const days = Array.from({ length: 42 }, (_, i) => { const d = new Date(gridStart); d.setDate(d.getDate() + i); return d; });
  const dows = weekdayShort(lang);
  return (
    <div className="space-y-2">
      <nav className="flex items-center gap-2">
        <button type="button" className="chip" onClick={() => onMove(-1)} aria-label={t(lang, "agenda.prev")}>&lt;</button>
        <h4 className="flex-1 text-center text-[15px] font-bold capitalize" style={{ color: `hsl(${accent})` }}>{monthLabel(lang, year, month)}</h4>
        <button type="button" className="chip" onClick={() => onMove(1)} aria-label={t(lang, "agenda.next")}>&gt;</button>
      </nav>
      <div className="grid grid-cols-7 gap-1 pb-1 text-center text-[11px] font-semibold uppercase text-muted-foreground">
        {dows.map((d, i) => <div key={i}>{d}</div>)}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {days.map((d) => (
          <AgendaDayCell key={d.toISOString()} lang={lang} accent={accent} date={d} inMonth={d.getMonth() === month} grouped={grouped} onPick={onPick} onDay={onDay} />
        ))}
      </div>
    </div>
  );
}
