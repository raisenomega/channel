/**
 * HUB by Raisen — Celda de dia del grid de Agenda (lista sus citas, clic = abrir). C4 <=75.
 */
import type { Idioma } from "@/lib/i18n";
import { sameDay, timeLabel } from "./agenda-dates";
import type { RowAppointment } from "./agenda-types";

export function AgendaDayCell({ lang, accent, date, inMonth, items, onPick }: {
  lang: Idioma;
  accent: string;
  date: Date;
  inMonth: boolean;
  items: RowAppointment[];
  onPick: (a: RowAppointment) => void;
}) {
  const today = sameDay(date, new Date());
  const citas = items.filter((a) => sameDay(new Date(a.scheduled_at), date));
  return (
    <div
      className={"min-h-[84px] rounded-lg border p-1 " + (inMonth ? "border-border/40" : "border-transparent opacity-40")}
      style={today ? { borderColor: `hsl(${accent})` } : undefined}
    >
      <div className="mb-0.5 text-right text-[11px] font-semibold" style={today ? { color: `hsl(${accent})` } : undefined}>
        {date.getDate()}
      </div>
      <div className="space-y-0.5">
        {citas.slice(0, 3).map((a) => (
          <button
            key={a.id}
            type="button"
            onClick={() => onPick(a)}
            className="block w-full truncate rounded px-1 py-0.5 text-left text-[11px] text-white"
            style={{ background: `hsl(${accent} / 0.65)` }}
            title={a.title}
          >
            {timeLabel(lang, a.scheduled_at)} {a.title}
          </button>
        ))}
        {citas.length > 3 && <div className="px-1 text-[10px] text-muted-foreground">+{citas.length - 3}</div>}
      </div>
    </div>
  );
}
