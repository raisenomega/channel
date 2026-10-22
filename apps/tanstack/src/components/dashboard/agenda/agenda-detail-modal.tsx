/**
 * HUB by Raisen — Modal de detalle de cita (ancho, header fijo + body con scroll) + Editar. C4 <=75.
 */
import type { Idioma } from "@/lib/i18n";
import { t } from "@/lib/i18n";
import { useApptDetail } from "./agenda-detail-hook";
import { AgendaDetailSections } from "./agenda-detail-sections";
import { fullDate } from "./agenda-dates";
import type { RowAppointment } from "./agenda-types";

function fmt(lang: Idioma, iso: string): string {
  return new Intl.DateTimeFormat(lang === "es" ? "es-ES" : "en-US", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }).format(new Date(iso));
}
const remLabel = (m: number): string => (m >= 1440 ? `${m / 1440}d` : m >= 60 ? `${m / 60}h` : `${m}m`);
function Field({ k, v }: { k: string; v: string }) {
  return <div className="min-w-0"><dt className="text-muted-foreground">{k}</dt><dd className="truncate font-semibold text-foreground">{v}</dd></div>;
}
function Para({ label, v }: { label: string; v: string }) {
  return <div className="mt-3"><p className="text-[11px] font-bold uppercase text-muted-foreground">{label}</p><p className="text-xs text-foreground">{v}</p></div>;
}

export function AgendaDetailModal({ lang, accent, appt, onClose, onEdit }: {
  lang: Idioma; accent: string; appt: RowAppointment; onClose: () => void; onEdit: (a: RowAppointment) => void;
}) {
  const d = useApptDetail(appt);
  const nombre = [d.contact?.first_name, d.contact?.last_name].filter(Boolean).join(" ");
  const who = d.contact?.display_name || nombre || t(lang, "agenda.sinCliente");
  const agente = d.agent ? `${d.agent.display_name ?? ""}${d.agent.agent_type === "ai_agent" ? " (IA)" : ""}`.trim() : appt.created_by_type === "ai_agent" ? "IA" : (appt.created_by_name || t(lang, "agenda.humano"));
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 p-4" onClick={onClose}>
      <div className="glass-card flex max-h-[82vh] w-full max-w-4xl flex-col overflow-hidden" onClick={(e) => e.stopPropagation()}>
        <div className="flex shrink-0 items-start justify-between gap-3 border-b border-border/40 px-6 py-4">
          <div className="min-w-0">
            <h3 className="text-lg font-bold text-foreground">{appt.title}</h3>
            <p className="text-sm capitalize text-muted-foreground">{fullDate(lang, appt.scheduled_at)}</p>
          </div>
          <div className="flex shrink-0 gap-2">
            <button type="button" className="chip font-semibold" style={{ color: `hsl(${accent})`, borderColor: `hsl(${accent})` }} onClick={() => onEdit(appt)}>{t(lang, "agenda.editar")}</button>
            <button type="button" className="chip" onClick={onClose} aria-label={t(lang, "common.back")}>X</button>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto px-6 py-4">
          <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs sm:grid-cols-3">
            <Field k={t(lang, "agenda.d.cliente")} v={who} />
            {d.contact?.primary_phone && <div className="min-w-0"><dt className="text-muted-foreground">{t(lang, "agenda.d.tel")}</dt><dd className="truncate"><a href={`tel:${d.contact.primary_phone}`} className="font-semibold" style={{ color: `hsl(${accent})` }}>{d.contact.primary_phone}</a></dd></div>}
            {d.contact?.primary_email && <div className="min-w-0"><dt className="text-muted-foreground">{t(lang, "agenda.d.email")}</dt><dd className="truncate"><a href={`mailto:${d.contact.primary_email}`} className="font-semibold" style={{ color: `hsl(${accent})` }}>{d.contact.primary_email}</a></dd></div>}
            <Field k={t(lang, "agenda.d.estado")} v={t(lang, "agenda.st." + appt.status)} />
            <Field k={t(lang, "agenda.d.canal")} v={appt.channel ?? "-"} />
            <Field k={t(lang, "agenda.d.agente")} v={agente} />
            {appt.created_at && <Field k={t(lang, "agenda.d.creada")} v={fmt(lang, appt.created_at)} />}
            <Field k={t(lang, "agenda.f.tipo")} v={t(lang, "agenda.mt." + appt.meeting_type)} />
          </dl>
          {appt.meeting_url && <a href={appt.meeting_url} target="_blank" rel="noopener noreferrer" className="mt-3 inline-block rounded-lg px-3 py-1.5 text-xs font-bold text-white" style={{ background: `hsl(${accent})` }}>{t(lang, "agenda.d.video")}</a>}
          {appt.reason && <Para label={t(lang, "agenda.d.motivo")} v={appt.reason} />}
          {appt.pre_notes && <Para label={t(lang, "agenda.d.acuerdo")} v={appt.pre_notes} />}
          {appt.description && <p className="mt-3 rounded-lg bg-muted/30 p-2 text-xs text-foreground">{appt.description}</p>}
          {appt.reminders && appt.reminders.length > 0 && <p className="mt-3 text-xs text-muted-foreground">{t(lang, "agenda.d.recordatorios")}: {appt.reminders.map(remLabel).join(" - ")}</p>}
          {appt.media && appt.media.length > 0 && (
            <div className="mt-3">
              <p className="text-[11px] font-bold uppercase text-muted-foreground">{t(lang, "agenda.d.media")}</p>
              {appt.media.map((mm) => <a key={mm.url} href={mm.url} target="_blank" rel="noopener noreferrer" className="block truncate text-xs" style={{ color: `hsl(${accent})` }}>{mm.type} - {mm.name}</a>)}
            </div>
          )}
          <AgendaDetailSections lang={lang} d={d} />
        </div>
      </div>
    </div>
  );
}
