/**
 * HUB by Raisen — Vista SEMANA: 7 columnas (Dom->Sab), header de dia clickable (= vista Dia)
 * + citas del dia; flechas semana a semana (cruza mes = recarga). C4 <=75.
 */
import { useState } from "react";
import type { Idioma } from "@/lib/i18n";
import { t } from "@/lib/i18n";
import { ApptChip } from "./agenda-appt-chip";
import { addDays, startOfWeek, dayKey, weekdayDayLabel, sameDay } from "./agenda-dates";
import type { RowAppointment } from "./agenda-types";

export function AgendaWeekView({ lang, accent, anchor, cursorMonth, grouped, onOpenDay, onPick, onCrossMonth }: {
  lang: Idioma;
  accent: string;
  anchor: Date;
  cursorMonth: number;
  grouped: Map<string, RowAppointment[]>;
  onOpenDay: (d: Date) => void;
  onPick: (a: RowAppointment) => void;
  onCrossMonth: (d: Date) => void;
}) {
  const [start, setStart] = useState<Date>(() => startOfWeek(anchor));
  const days = Array.from({ length: 7 }, (_, i) => addDays(start, i));
  const end = addDays(start, 6);
  const shift = (delta: number) => { const ns = addDays(start, delta * 7); setStart(ns); if (ns.getMonth() !== cursorMonth) onCrossMonth(ns); };
  return (
    <div className="space-y-2">
      <nav className="flex items-center justify-center gap-3">
        <button type="button" className="chip" onClick={() => shift(-1)} aria-label={t(lang, "agenda.prev")}>&lt;</button>
        <span className="text-xs font-medium tabular-nums">{dayKey(start)} / {dayKey(end)}</span>
        <button type="button" className="chip" onClick={() => shift(1)} aria-label={t(lang, "agenda.next")}>&gt;</button>
      </nav>
      <div className="grid grid-cols-7 gap-1.5">
        {days.map((d) => (
          <div key={dayKey(d)} className={"min-w-0 space-y-1 rounded p-1 " + (sameDay(d, new Date()) ? "bg-muted/30" : "")}>
            <button type="button" onClick={() => onOpenDay(d)} className="w-full truncate text-center text-[11px] font-semibold capitalize hover:underline" style={{ color: `hsl(${accent})` }}>
              {weekdayDayLabel(lang, d)}
            </button>
            {(grouped.get(dayKey(d)) ?? []).map((a) => <ApptChip key={a.id} lang={lang} accent={accent} appt={a} onPick={onPick} />)}
          </div>
        ))}
      </div>
    </div>
  );
}
