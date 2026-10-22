/**
 * HUB by Raisen — CRM: lista de citas Agendadas (filas, 16/pag + paginacion, clic = ficha). C4 <=75.
 */
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import type { Idioma } from "@/lib/i18n";
import { t } from "@/lib/i18n";
import { fetchAllAppointments } from "@/components/dashboard/agenda/agenda-fetchers";
import { AgendaDetailModal } from "@/components/dashboard/agenda/agenda-detail-modal";
import { AgendaCreateModal } from "@/components/dashboard/agenda/agenda-create-modal";
import { fetchMiTenantInfo } from "@/lib/tenant-client/mi-tenant-info";
import type { RowAppointment } from "@/components/dashboard/agenda/agenda-types";

const PAGE = 16;
const ACCENT = "var(--primary)";

export function AgendadosList({ language }: { language: Idioma }) {
  const { data } = useQuery({ queryKey: ["agendados"], queryFn: fetchAllAppointments, staleTime: 15_000 });
  const mi = useQuery({ queryKey: ["mi-tenant"], queryFn: fetchMiTenantInfo, staleTime: 300_000 });
  const [page, setPage] = useState(0);
  const [open, setOpen] = useState<RowAppointment | null>(null);
  const [editing, setEditing] = useState<RowAppointment | null>(null);
  const rows = data ?? [];
  const pages = Math.max(1, Math.ceil(rows.length / PAGE));
  const slice = rows.slice(page * PAGE, page * PAGE + PAGE);
  const fmt = (iso: string) => new Date(iso).toLocaleString(language === "es" ? "es-ES" : "en-US", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
  if (rows.length === 0) return <p className="py-8 text-center text-sm text-muted-foreground">{t(language, "agenda.sinAgendados")}</p>;
  return (
    <div className="space-y-2">
      <div className="overflow-hidden rounded-xl border border-border/40">
        {slice.map((a) => (
          <button key={a.id} type="button" onClick={() => setOpen(a)} className="flex w-full items-center gap-3 border-b border-border/30 px-3 py-2 text-left hover:bg-muted/30">
            <span className="w-28 shrink-0 text-xs text-muted-foreground">{fmt(a.scheduled_at)}</span>
            <span className="flex-1 truncate text-sm font-medium text-foreground">{a.title}</span>
            <span className="shrink-0 text-xs font-semibold" style={{ color: "hsl(var(--primary))" }}>{t(language, "agenda.st." + a.status)}</span>
          </button>
        ))}
      </div>
      {pages > 1 && (
        <div className="flex items-center justify-center gap-3 text-xs">
          <button type="button" className="chip" disabled={page === 0} onClick={() => setPage((p) => p - 1)}>&lt;</button>
          <span className="tabular-nums">{page + 1} / {pages}</span>
          <button type="button" className="chip" disabled={page >= pages - 1} onClick={() => setPage((p) => p + 1)}>&gt;</button>
        </div>
      )}
      {open && <AgendaDetailModal lang={language} accent={ACCENT} appt={open} onClose={() => setOpen(null)} onEdit={(a) => { setOpen(null); setEditing(a); }} />}
      {editing && mi.data && <AgendaCreateModal lang={language} accent={ACCENT} tenantId={mi.data.tenantId} editing={editing} onClose={() => setEditing(null)} />}
    </div>
  );
}
