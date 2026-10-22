/**
 * HUB by Raisen — Vista DIA: citas del dia en pastillas grandes + flechas dia a dia. C4 <=75.
 */
import type { Idioma } from "@/lib/i18n";
import { t } from "@/lib/i18n";
import { ApptChip } from "./agenda-appt-chip";
import { addDays, dayLabel } from "./agenda-dates";
import type { RowAppointment } from "./agenda-types";

export function AgendaDayView({ lang, accent, day, items, onChangeDay, onPick }: {
  lang: Idioma;
  accent: string;
  day: Date;
  items: RowAppointment[];
  onChangeDay: (d: Date) => void;
  onPick: (a: RowAppointment) => void;
}) {
  return (
    <div className="space-y-3">
      <nav className="flex items-center justify-center gap-3">
        <button type="button" className="chip" onClick={() => onChangeDay(addDays(day, -1))} aria-label={t(lang, "agenda.prev")}>&lt;</button>
        <h4 className="text-sm font-bold capitalize tabular-nums" style={{ color: `hsl(${accent})` }}>{dayLabel(lang, day)}</h4>
        <button type="button" className="chip" onClick={() => onChangeDay(addDays(day, 1))} aria-label={t(lang, "agenda.next")}>&gt;</button>
      </nav>
      {items.length === 0 ? (
        <p className="py-10 text-center text-sm text-muted-foreground">{t(lang, "agenda.sinDia")}</p>
      ) : (
        <div className="space-y-2">
          {items.map((a) => <ApptChip key={a.id} lang={lang} accent={accent} appt={a} onPick={onPick} big />)}
        </div>
      )}
    </div>
  );
}
