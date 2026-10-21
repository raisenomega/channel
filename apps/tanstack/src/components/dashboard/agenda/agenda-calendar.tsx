/**
 * HUB by Raisen — Agenda: calendario mensual con navegacion + modal de detalle. C4 <=75.
 */
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import type { Idioma } from "@/lib/i18n";
import { t } from "@/lib/i18n";
import { fetchAppointments } from "./agenda-fetchers";
import { AgendaGrid } from "./agenda-grid";
import { AgendaDetailModal } from "./agenda-detail-modal";
import { monthRange, monthLabel } from "./agenda-dates";
import type { RowAppointment } from "./agenda-types";

const nowCursor = () => { const d = new Date(); return { y: d.getFullYear(), m: d.getMonth() }; };

export function AgendaCalendar({ lang, accent }: { lang: Idioma; accent: string }) {
  const [cursor, setCursor] = useState(nowCursor);
  const [open, setOpen] = useState<RowAppointment | null>(null);
  const { from, to, gridStart } = monthRange(cursor.y, cursor.m);
  const { data } = useQuery({ queryKey: ["agenda", from, to], queryFn: () => fetchAppointments(from, to), staleTime: 15_000 });
  const move = (delta: number) => setCursor((c) => { const d = new Date(c.y, c.m + delta, 1); return { y: d.getFullYear(), m: d.getMonth() }; });
  return (
    <div className="space-y-3">
      <header className="flex items-center justify-between gap-2">
        <h4 className="text-[15px] font-bold capitalize" style={{ color: `hsl(${accent})` }}>{monthLabel(lang, cursor.y, cursor.m)}</h4>
        <div className="flex items-center gap-1.5">
          <button type="button" className="chip" onClick={() => move(-1)}>{t(lang, "agenda.prev")}</button>
          <button type="button" className="chip" onClick={() => setCursor(nowCursor())}>{t(lang, "agenda.today")}</button>
          <button type="button" className="chip" onClick={() => move(1)}>{t(lang, "agenda.next")}</button>
        </div>
      </header>
      <AgendaGrid lang={lang} accent={accent} gridStart={gridStart} month={cursor.m} items={data ?? []} onPick={setOpen} />
      {open && <AgendaDetailModal lang={lang} accent={accent} appt={open} onClose={() => setOpen(null)} />}
    </div>
  );
}
