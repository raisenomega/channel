/**
 * HUB by Raisen — Celda de dia del grid (clic en el dia = abrir vista Dia; clic en cita = modal). C4 <=75.
 */
import type { Idioma } from "@/lib/i18n";
import { sameDay, dayKey } from "./agenda-dates";
import { ApptChip } from "./agenda-appt-chip";
import type { RowAppointment } from "./agenda-types";

export function AgendaDayCell({ lang, accent, date, inMonth, grouped, onPick, onDay }: {
  lang: Idioma;
  accent: string;
  date: Date;
  inMonth: boolean;
  grouped: Map<string, RowAppointment[]>;
  onPick: (a: RowAppointment) => void;
  onDay: (d: Date) => void;
}) {
  const today = sameDay(date, new Date());
  const citas = grouped.get(dayKey(date)) ?? [];
  const borde = inMonth ? "border-border/40" : "border-transparent opacity-40";
  return (
    <div className={"flex min-h-[84px] flex-col rounded-lg border p-1 " + borde} style={today ? { borderColor: `hsl(${accent})` } : undefined}>
      <button
        type="button"
        onClick={() => onDay(date)}
        className="mb-0.5 w-full text-right text-[11px] font-semibold hover:underline"
        style={today ? { color: `hsl(${accent})` } : undefined}
        aria-label={dayKey(date)}
      >
        {date.getDate()}
      </button>
      <div className="space-y-0.5">
        {citas.slice(0, 3).map((a) => <ApptChip key={a.id} lang={lang} accent={accent} appt={a} onPick={onPick} />)}
        {citas.length > 3 && <div className="px-1 text-[10px] text-muted-foreground">+{citas.length - 3}</div>}
      </div>
      <button type="button" onClick={() => onDay(date)} className="mt-auto h-3 w-full" aria-label={dayKey(date)} />
    </div>
  );
}
