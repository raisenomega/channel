/**
 * HUB by Raisen — Campos propios de la cita (titulo/fecha/hora/estado/canal/tipo/creada por). C4 <=75.
 */
import type { Idioma } from "@/lib/i18n";
import { t } from "@/lib/i18n";
import { L, INP, type ApptForm } from "./agenda-form-ui";

const STATUS = ["scheduled", "confirmed", "completed", "cancelled", "no_show"];
const CHANNELS = ["whatsapp", "instagram", "facebook", "telegram", "email", "sms", "call", "crm", "webchat"];
const MT = ["in_person", "call", "video"];

export function AgendaCreateFields({ lang, f, set }: {
  lang: Idioma;
  f: ApptForm;
  set: <K extends keyof ApptForm>(k: K, v: ApptForm[K]) => void;
}) {
  return (
    <div className="grid grid-cols-2 gap-3">
      <div className="col-span-2"><L label={t(lang, "agenda.f.title")}><input className={INP} value={f.title} onChange={(e) => set("title", e.target.value)} /></L></div>
      <L label={t(lang, "agenda.f.date")}><input type="date" className={INP} value={f.date} onChange={(e) => set("date", e.target.value)} /></L>
      <L label={t(lang, "agenda.f.time")}><input type="time" className={INP} value={f.time} onChange={(e) => set("time", e.target.value)} /></L>
      <L label={t(lang, "agenda.d.estado")}><select className={INP} value={f.status} onChange={(e) => set("status", e.target.value)}>{STATUS.map((s) => <option key={s} value={s}>{t(lang, "agenda.st." + s)}</option>)}</select></L>
      <L label={t(lang, "agenda.d.canal")}><select className={INP} value={f.channel} onChange={(e) => set("channel", e.target.value)}><option value="">-</option>{CHANNELS.map((c) => <option key={c} value={c}>{c}</option>)}</select></L>
      <L label={t(lang, "agenda.f.tipo")}><select className={INP} value={f.meetingType} onChange={(e) => set("meetingType", e.target.value)}>{MT.map((x) => <option key={x} value={x}>{t(lang, "agenda.mt." + x)}</option>)}</select></L>
      <L label={t(lang, "agenda.f.creadaPor")}><select className={INP} value={f.createdBy} onChange={(e) => set("createdBy", e.target.value)}><option value="human">{t(lang, "agenda.humano")}</option><option value="ai_agent">IA</option></select></L>
    </div>
  );
}
