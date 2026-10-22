/**
 * HUB by Raisen — Campos del formulario de nueva cita (propios + relacionados). C4 <=75.
 */
import type { ReactNode } from "react";
import type { Idioma } from "@/lib/i18n";
import { t } from "@/lib/i18n";
import type { ContactListItem } from "@/lib/contacts-client/types";

export interface ApptForm {
  title: string; date: string; time: string; status: string; channel: string;
  createdBy: string; contactId: string; conversationId: string; agentId: string; description: string;
}
type Agent = { id: string; display_name: string | null };
type Conv = { id: string; subject: string | null; primary_channel: string | null };

const STATUS = ["scheduled", "confirmed", "completed", "cancelled", "no_show"];
const CHANNELS = ["whatsapp", "instagram", "facebook", "telegram", "email", "sms", "call", "crm", "webchat"];
const INP = "w-full rounded-lg border border-border/50 bg-background/40 px-2 py-1.5 text-sm text-foreground";

function L({ label, children }: { label: string; children: ReactNode }) {
  return <label className="block text-xs"><span className="mb-0.5 block text-muted-foreground">{label}</span>{children}</label>;
}

export function AgendaCreateFields({ lang, f, onChange, contacts, agents, convs }: {
  lang: Idioma; f: ApptForm; onChange: (f: ApptForm) => void;
  contacts: ContactListItem[]; agents: Agent[]; convs: Conv[];
}) {
  const set = (k: keyof ApptForm, v: string) => onChange({ ...f, [k]: v });
  return (
    <div className="grid grid-cols-2 gap-3">
      <div className="col-span-2"><L label={t(lang, "agenda.f.title")}><input className={INP} value={f.title} onChange={(e) => set("title", e.target.value)} /></L></div>
      <L label={t(lang, "agenda.f.date")}><input type="date" className={INP} value={f.date} onChange={(e) => set("date", e.target.value)} /></L>
      <L label={t(lang, "agenda.f.time")}><input type="time" className={INP} value={f.time} onChange={(e) => set("time", e.target.value)} /></L>
      <L label={t(lang, "agenda.d.estado")}><select className={INP} value={f.status} onChange={(e) => set("status", e.target.value)}>{STATUS.map((s) => <option key={s} value={s}>{t(lang, "agenda.st." + s)}</option>)}</select></L>
      <L label={t(lang, "agenda.d.canal")}><select className={INP} value={f.channel} onChange={(e) => set("channel", e.target.value)}><option value="">-</option>{CHANNELS.map((c) => <option key={c} value={c}>{c}</option>)}</select></L>
      <L label={t(lang, "agenda.f.creadaPor")}><select className={INP} value={f.createdBy} onChange={(e) => set("createdBy", e.target.value)}><option value="human">{t(lang, "agenda.humano")}</option><option value="ai_agent">IA</option></select></L>
      <L label={t(lang, "agenda.d.cliente")}><select className={INP} value={f.contactId} onChange={(e) => set("contactId", e.target.value)}><option value="">-</option>{contacts.map((c) => <option key={c.id} value={c.id}>{c.displayName}</option>)}</select></L>
      <L label={t(lang, "agenda.d.conversacion")}><select className={INP} value={f.conversationId} disabled={!f.contactId} onChange={(e) => set("conversationId", e.target.value)}><option value="">-</option>{convs.map((c) => <option key={c.id} value={c.id}>{c.subject || c.primary_channel || c.id.slice(0, 8)}</option>)}</select></L>
      <L label={t(lang, "agenda.d.agente")}><select className={INP} value={f.agentId} onChange={(e) => set("agentId", e.target.value)}><option value="">-</option>{agents.map((a) => <option key={a.id} value={a.id}>{a.display_name ?? a.id.slice(0, 8)}</option>)}</select></L>
      <div className="col-span-2"><L label={t(lang, "agenda.f.desc")}><textarea className={INP} rows={2} value={f.description} onChange={(e) => set("description", e.target.value)} /></L></div>
    </div>
  );
}
