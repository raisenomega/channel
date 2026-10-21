/**
 * HUB by Raisen — Grid mensual 6x7 de la Agenda (encabezados + 42 celdas). C4 <=75.
 */
import type { Idioma } from "@/lib/i18n";
import { AgendaDayCell } from "./agenda-day-cell";
import { weekdayShort } from "./agenda-dates";
import type { RowAppointment } from "./agenda-types";

export function AgendaGrid({ lang, accent, gridStart, month, items, onPick }: {
  lang: Idioma;
  accent: string;
  gridStart: Date;
  month: number;
  items: RowAppointment[];
  onPick: (a: RowAppointment) => void;
}) {
  const days = Array.from({ length: 42 }, (_, i) => {
    const d = new Date(gridStart);
    d.setDate(d.getDate() + i);
    return d;
  });
  const dows = weekdayShort(lang);
  return (
    <div>
      <div className="grid grid-cols-7 gap-1 pb-1 text-center text-[11px] font-semibold uppercase text-muted-foreground">
        {dows.map((d, i) => <div key={i}>{d}</div>)}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {days.map((d) => (
          <AgendaDayCell
            key={d.toISOString()}
            lang={lang}
            accent={accent}
            date={d}
            inMonth={d.getMonth() === month}
            items={items}
            onPick={onPick}
          />
        ))}
      </div>
    </div>
  );
}
