/**
 * HUB by Raisen — Modal crear / editar cita (campos propios + relaciones + extra). Al guardar
 * hace INSERT o UPDATE a Supabase e invalida la Agenda y la lista Agendados. C4 <=75.
 */
import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { Idioma } from "@/lib/i18n";
import { t } from "@/lib/i18n";
import { createAppointment, updateAppointment } from "./agenda-create";
import { useApptFormData } from "./agenda-create-data";
import { AgendaCreateFields } from "./agenda-create-fields";
import { AgendaCreateRelations } from "./agenda-create-relations";
import { AgendaCreateExtra } from "./agenda-create-extra";
import { emptyForm, formFromAppt, toPayload } from "./agenda-form-map";
import type { ApptForm } from "./agenda-form-ui";
import type { RowAppointment } from "./agenda-types";

export function AgendaCreateModal({ lang, accent, tenantId, editing, onClose }: {
  lang: Idioma; accent: string; tenantId: string; editing: RowAppointment | null; onClose: () => void;
}) {
  const qc = useQueryClient();
  const [f, setF] = useState<ApptForm>(() => (editing ? formFromAppt(editing) : emptyForm()));
  const set = <K extends keyof ApptForm>(k: K, v: ApptForm[K]) => setF((p) => ({ ...p, [k]: v }));
  const onContact = (id: string) => setF((p) => ({ ...p, contactId: id, conversationId: "", quoteId: "", orderId: "" }));
  const data = useApptFormData(f.contactId);
  const m = useMutation({
    mutationFn: () => (editing ? updateAppointment(editing.id, toPayload(f)) : createAppointment(tenantId, toPayload(f))),
    onSuccess: (r) => { if (r.ok) { void qc.invalidateQueries({ queryKey: ["agenda"] }); void qc.invalidateQueries({ queryKey: ["agendados"] }); onClose(); } },
  });
  const valido = !!f.title.trim() && !!f.date && !!f.time;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 p-4" onClick={onClose}>
      <div className="glass-card max-h-[88vh] w-full max-w-2xl overflow-y-auto p-5" onClick={(e) => e.stopPropagation()}>
        <h3 className="mb-3 text-base font-bold text-foreground">{t(lang, editing ? "agenda.editar" : "agenda.nueva")}</h3>
        <div className="space-y-3">
          <AgendaCreateFields lang={lang} f={f} set={set} />
          <AgendaCreateRelations lang={lang} f={f} set={set} onContact={onContact} contacts={data.contacts} convs={data.convs} agents={data.agents} quotes={data.quotes} orders={data.orders} docs={data.docs} />
          <AgendaCreateExtra lang={lang} accent={accent} tenantId={tenantId} f={f} set={set} />
        </div>
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
