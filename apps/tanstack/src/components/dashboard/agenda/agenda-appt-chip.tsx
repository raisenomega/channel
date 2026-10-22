/**
 * HUB by Raisen — Pastilla de cita reutilizable (clic = abrir el modal de detalle). C4 <=75.
 */
import type { Idioma } from "@/lib/i18n";
import { timeLabel } from "./agenda-dates";
import type { RowAppointment } from "./agenda-types";

export function ApptChip({ lang, accent, appt, onPick, big }: {
  lang: Idioma;
  accent: string;
  appt: RowAppointment;
  onPick: (a: RowAppointment) => void;
  big?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={(e) => { e.stopPropagation(); onPick(appt); }}
      title={appt.title}
      className={"block w-full truncate rounded text-left text-white " + (big ? "px-2 py-1.5 text-xs" : "px-1 py-0.5 text-[11px]")}
      style={{ background: `hsl(${accent} / 0.65)` }}
    >
      {timeLabel(lang, appt.scheduled_at)} {appt.title}
    </button>
  );
}
