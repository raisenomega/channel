/**
 * HUB by Raisen — B8: ficha del contacto en modal (mismo estilo/tamano que el de Agendados). Info del
 * contacto + TIMELINE de lo que el agente ha hecho/decidido (sus borradores/respuestas/cierres). C4 <=75.
 */
import { useQuery, useQueryClient } from "@tanstack/react-query";
import type { Idioma } from "@/lib/i18n";
import { t } from "@/lib/i18n";
import type { ContactListItem } from "@/lib/contacts-client";
import { CANAL } from "./contacts-data";
import { fetchContactDetail, type ContactActivityItem } from "./contact-detail-fetchers";
import { ContactExtras } from "./contact-detail-extras";

const ST: Record<string, string> = { draft: "Borrador", approved: "Aprobado", sent: "Enviado", rejected: "Denegado", expired: "Expirado" };
const SC = (s: string | null): string => (s === "strategic" ? "Cierre de venta" : s === "opportunity" ? "Oportunidad" : "Respuesta");

function Fila({ label, v }: { label: string; v: string }) {
  return <div className="flex justify-between gap-2 text-xs"><span className="text-muted-foreground">{label}</span><span className="truncate font-semibold text-foreground">{v}</span></div>;
}

function Evento({ a, fmt }: { a: ContactActivityItem; fmt: (s: string) => string }) {
  return (
    <div className="rounded-lg border border-border/40 bg-card-soft p-2 text-[11px]">
      <div className="flex items-center justify-between gap-2 font-semibold">
        <span style={{ color: "hsl(265 55% 62%)" }}>{SC(a.scope)}</span>
        <span className="text-muted-foreground">{fmt(a.createdAt)} · {ST[a.status] ?? a.status}</span>
      </div>
      <p className="mt-1 line-clamp-3 whitespace-pre-wrap text-foreground">{a.draftContent}</p>
      {a.conclusion ? <p className="mt-1 text-muted-foreground"><span className="font-bold">Por que:</span> {a.conclusion}</p> : null}
    </div>
  );
}

export function ContactDetailModal({ lang, contact, onClose }: { lang: Idioma; contact: ContactListItem; onClose: () => void }) {
  const qc = useQueryClient();
  const { data } = useQuery({ queryKey: ["contact-activity", contact.id], queryFn: () => fetchContactDetail(contact.id), staleTime: 15_000 });
  const activity = data?.activity ?? []; const notes = data?.notes ?? []; const temperature = data?.temperature ?? null;
  const fmt = (iso: string) => new Date(iso).toLocaleString(lang === "es" ? "es-ES" : "en-US", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div className="flex max-h-[85vh] w-full max-w-xl flex-col gap-3 overflow-hidden rounded-2xl border border-border/50 bg-card p-5" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start justify-between gap-2">
          <div><h3 className="text-lg font-bold text-foreground">{contact.displayName}</h3>
            <div className="mt-0.5 flex items-center gap-1.5 text-[11px]">
              {contact.channel && CANAL[contact.channel] ? <span className="rounded px-1.5 py-0.5 font-bold" style={{ background: CANAL[contact.channel]!.bg, color: CANAL[contact.channel]!.fg }}>{CANAL[contact.channel]!.label}</span> : null}
              <span className="font-semibold" style={{ color: "hsl(var(--primary))" }}>{t(lang, "contacts.segment." + (contact.segment || "general"))}</span>
              {contact.type === "empresa" ? <span className="text-muted-foreground">· {t(lang, "contacts.type.empresa")}</span> : null}
            </div>
          </div>
          <button type="button" onClick={onClose} className="shrink-0 text-xl text-muted-foreground hover:text-foreground" aria-label="x">{"×"}</button>
        </div>
        <div className="shrink-0 space-y-1 rounded-lg bg-muted/20 p-2">
          <Fila label={t(lang, "contacts.phone")} v={contact.phone ?? "—"} />
          <Fila label="Email" v={contact.email ?? "—"} />
          <Fila label={t(lang, "contacts.orders")} v={String(contact.totalOrders)} />
        </div>
        <ContactExtras lang={lang} contactId={contact.id} notes={notes} temperature={temperature} onChange={() => void qc.invalidateQueries({ queryKey: ["contact-activity", contact.id] })} />
        <p className="shrink-0 text-[11px] font-bold uppercase text-muted-foreground">{t(lang, "contacts.agentTimeline")}</p>
        <div className="flex-1 space-y-2 overflow-y-auto">
          {activity.length === 0 ? <p className="text-xs text-muted-foreground">{t(lang, "contacts.noActivity")}</p> : activity.map((a) => <Evento key={a.id} a={a} fmt={fmt} />)}
        </div>
      </div>
    </div>
  );
}
