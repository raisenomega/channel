/**
 * HUB by Raisen — Modal de detalle de una cita (overlay sobre el grid). C4 <=75.
 */
import type { Idioma } from "@/lib/i18n";
import { t } from "@/lib/i18n";
import { useApptDetail } from "./agenda-detail-hook";
import { AgendaDetailSections } from "./agenda-detail-sections";
import { fullDate } from "./agenda-dates";
import type { RowAppointment } from "./agenda-types";

export function AgendaDetailModal({ lang, accent, appt, onClose }: {
  lang: Idioma;
  accent: string;
  appt: RowAppointment;
  onClose: () => void;
}) {
  const d = useApptDetail(appt);
  const nombre = [d.contact?.first_name, d.contact?.last_name].filter(Boolean).join(" ");
  const who = d.contact?.display_name || nombre || t(lang, "agenda.sinCliente");
  const agente = d.agent
    ? `${d.agent.display_name ?? ""}${d.agent.agent_type === "ai_agent" ? " (IA)" : ""}`.trim()
    : appt.created_by_type === "ai_agent" ? "IA" : t(lang, "agenda.humano");
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 p-4" onClick={onClose}>
      <div className="glass-card max-h-[85vh] w-full max-w-lg overflow-y-auto p-5" onClick={(e) => e.stopPropagation()}>
        <div className="mb-3 flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="text-base font-bold text-foreground">{appt.title}</h3>
            <p className="text-xs capitalize text-muted-foreground">{fullDate(lang, appt.scheduled_at)}</p>
          </div>
          <button type="button" onClick={onClose} className="chip shrink-0" aria-label={t(lang, "common.back")}>X</button>
        </div>
        <dl className="grid grid-cols-2 gap-x-3 gap-y-2 text-xs">
          <div><dt className="text-muted-foreground">{t(lang, "agenda.d.cliente")}</dt><dd className="font-semibold text-foreground">{who}</dd></div>
          <div><dt className="text-muted-foreground">{t(lang, "agenda.d.estado")}</dt><dd className="font-semibold" style={{ color: `hsl(${accent})` }}>{t(lang, "agenda.st." + appt.status)}</dd></div>
          <div><dt className="text-muted-foreground">{t(lang, "agenda.d.canal")}</dt><dd className="font-semibold capitalize text-foreground">{appt.channel ?? "-"}</dd></div>
          <div><dt className="text-muted-foreground">{t(lang, "agenda.d.agente")}</dt><dd className="font-semibold text-foreground">{agente}</dd></div>
        </dl>
        {appt.description && <p className="mt-3 rounded-lg bg-muted/30 p-2 text-xs text-foreground">{appt.description}</p>}
        <AgendaDetailSections lang={lang} d={d} />
      </div>
    </div>
  );
}
