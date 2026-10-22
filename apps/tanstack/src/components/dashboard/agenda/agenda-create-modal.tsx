/**
 * HUB by Raisen — Modal para crear una cita (formulario + relaciones). Al guardar, INSERT a
 * Supabase e invalida la Agenda para que aparezca en su dia. C4 <=75.
 */
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { Idioma } from "@/lib/i18n";
import { t } from "@/lib/i18n";
import { createAppointment } from "./agenda-create";
import { fetchConvsForContact } from "./agenda-detail-fetchers";
import { fetchAgents } from "@/components/dashboard/channel/channel-tab-global-fetchers";
import { listarContactos } from "@/lib/contacts-client/functions";
import { AgendaCreateFields, type ApptForm } from "./agenda-create-fields";

const EMPTY: ApptForm = { title: "", date: "", time: "09:00", status: "scheduled", channel: "", createdBy: "human", contactId: "", conversationId: "", agentId: "", description: "" };

export function AgendaCreateModal({ lang, accent, tenantId, onClose }: {
  lang: Idioma; accent: string; tenantId: string; onClose: () => void;
}) {
  const qc = useQueryClient();
  const [f, setF] = useState<ApptForm>(() => ({ ...EMPTY, date: new Date().toISOString().slice(0, 10) }));
  const contactos = useQuery({ queryKey: ["ag-contacts"], queryFn: listarContactos, staleTime: 60_000 });
  const agentes = useQuery({ queryKey: ["ag-agents"], queryFn: fetchAgents, staleTime: 60_000 });
  const convs = useQuery({ queryKey: ["ag-convs", f.contactId], queryFn: () => fetchConvsForContact(f.contactId), enabled: !!f.contactId });
  const m = useMutation({
    mutationFn: () => createAppointment({
      tenant_id: tenantId, title: f.title.trim(), scheduled_at: new Date(`${f.date}T${f.time}`).toISOString(),
      status: f.status, channel: f.channel || null, created_by_type: f.createdBy,
      contact_id: f.contactId || null, conversation_id: f.conversationId || null, agent_id: f.agentId || null,
      description: f.description.trim() || null,
    }),
    onSuccess: (r) => { if (r.ok) { void qc.invalidateQueries({ queryKey: ["agenda"] }); onClose(); } },
  });
  const cd = contactos.data;
  const contacts = cd && cd.ok ? cd.value : [];
  const valido = !!f.title.trim() && !!f.date && !!f.time;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 p-4" onClick={onClose}>
      <div className="glass-card max-h-[85vh] w-full max-w-lg overflow-y-auto p-5" onClick={(e) => e.stopPropagation()}>
        <h3 className="mb-3 text-base font-bold text-foreground">{t(lang, "agenda.nueva")}</h3>
        <AgendaCreateFields lang={lang} f={f} onChange={setF} contacts={contacts} agents={agentes.data ?? []} convs={convs.data ?? []} />
        {m.data && !m.data.ok && <p className="mt-2 text-xs text-red-400">{t(lang, "agenda.err")}: {m.data.error}</p>}
        <div className="mt-4 flex justify-end gap-2">
          <button type="button" className="chip" onClick={onClose}>{t(lang, "onboarding.cancel")}</button>
          <button type="button" className="chip font-bold text-white" style={{ background: `hsl(${accent})` }} disabled={!valido || m.isPending} onClick={() => m.mutate()}>
            {m.isPending ? t(lang, "onboarding.saving") : t(lang, "agenda.guardar")}
          </button>
        </div>
      </div>
    </div>
  );
}
