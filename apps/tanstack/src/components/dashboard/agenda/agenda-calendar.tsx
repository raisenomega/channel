/**
 * HUB by Raisen — Agenda: vistas Mes / Semana / Dia + crear cita + modal de detalle. C4 <=75.
 * Clic en un dia -> vista Dia; clic en una cita -> modal (dato crudo relacionado).
 */
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import type { Idioma } from "@/lib/i18n";
import { t } from "@/lib/i18n";
import { fetchAppointments, groupByDay } from "./agenda-fetchers";
import { AgendaViewChips, type AgendaView } from "./agenda-view-chips";
import { AgendaMonth } from "./agenda-grid";
import { AgendaWeekView } from "./agenda-week-view";
import { AgendaDayView } from "./agenda-day-view";
import { AgendaDetailModal } from "./agenda-detail-modal";
import { AgendaCreateModal } from "./agenda-create-modal";
import { fetchMiTenantInfo } from "@/lib/tenant-client/mi-tenant-info";
import { monthRange, dayKey } from "./agenda-dates";
import type { RowAppointment } from "./agenda-types";

const nowCur = () => { const d = new Date(); return { y: d.getFullYear(), m: d.getMonth() }; };

export function AgendaCalendar({ lang, accent }: { lang: Idioma; accent: string }) {
  const [cur, setCur] = useState(nowCur);
  const [selected, setSelected] = useState<Date | null>(null);
  const [view, setView] = useState<AgendaView>("month");
  const [open, setOpen] = useState<RowAppointment | null>(null);
  const [creating, setCreating] = useState(false);
  const { from, to } = monthRange(cur.y, cur.m);
  const { data } = useQuery({ queryKey: ["agenda", from, to], queryFn: () => fetchAppointments(from, to), staleTime: 15_000 });
  const mi = useQuery({ queryKey: ["mi-tenant"], queryFn: fetchMiTenantInfo, staleTime: 300_000 });
  const grouped = useMemo(() => groupByDay(data ?? []), [data]);
  const viewDay = selected ?? new Date();
  const openDay = (d: Date) => { setSelected(d); if (d.getFullYear() !== cur.y || d.getMonth() !== cur.m) setCur({ y: d.getFullYear(), m: d.getMonth() }); setView("day"); };
  const toMonthOf = (d: Date) => setCur({ y: d.getFullYear(), m: d.getMonth() });
  const goToday = () => { const d = new Date(); setSelected(d); setCur({ y: d.getFullYear(), m: d.getMonth() }); };
  const move = (delta: number) => setCur((c) => { const d = new Date(c.y, c.m + delta, 1); return { y: d.getFullYear(), m: d.getMonth() }; });
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <AgendaViewChips lang={lang} accent={accent} view={view} onView={setView} onToday={goToday} />
        <button type="button" className="chip font-semibold" disabled={!mi.data} onClick={() => setCreating(true)} style={{ color: `hsl(${accent})`, borderColor: `hsl(${accent})` }}>+ {t(lang, "agenda.nueva")}</button>
      </div>
      {view === "month" && <AgendaMonth lang={lang} accent={accent} year={cur.y} month={cur.m} grouped={grouped} onDay={openDay} onPick={setOpen} onMove={move} />}
      {view === "week" && <AgendaWeekView lang={lang} accent={accent} anchor={viewDay} cursorMonth={cur.m} grouped={grouped} onOpenDay={openDay} onPick={setOpen} onCrossMonth={toMonthOf} />}
      {view === "day" && <AgendaDayView lang={lang} accent={accent} day={viewDay} items={grouped.get(dayKey(viewDay)) ?? []} onChangeDay={openDay} onPick={setOpen} />}
      {open && <AgendaDetailModal lang={lang} accent={accent} appt={open} onClose={() => setOpen(null)} />}
      {creating && mi.data && <AgendaCreateModal lang={lang} accent={accent} tenantId={mi.data.tenantId} onClose={() => setCreating(false)} />}
    </div>
  );
}
