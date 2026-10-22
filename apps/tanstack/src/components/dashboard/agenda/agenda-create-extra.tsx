/**
 * HUB by Raisen — Campos extra de la cita (razon, acuerdo previo, descripcion, recordatorios,
 * media documento/imagen/video). C4 <=75.
 */
import type { Idioma } from "@/lib/i18n";
import { t } from "@/lib/i18n";
import { L, INP, type ApptForm } from "./agenda-form-ui";
import { AgendaReminders } from "./agenda-reminders";
import { AgendaMediaUpload } from "./agenda-media-upload";

export function AgendaCreateExtra({ lang, accent, tenantId, f, set }: {
  lang: Idioma;
  accent: string;
  tenantId: string;
  f: ApptForm;
  set: <K extends keyof ApptForm>(k: K, v: ApptForm[K]) => void;
}) {
  return (
    <div className="space-y-3">
      <L label={t(lang, "agenda.f.reason")}><input className={INP} value={f.reason} onChange={(e) => set("reason", e.target.value)} /></L>
      <L label={t(lang, "agenda.f.pre")}><textarea className={INP} rows={2} value={f.preNotes} onChange={(e) => set("preNotes", e.target.value)} /></L>
      <L label={t(lang, "agenda.f.desc")}><textarea className={INP} rows={2} value={f.description} onChange={(e) => set("description", e.target.value)} /></L>
      <div>
        <span className="mb-1 block text-xs text-muted-foreground">{t(lang, "agenda.f.recordatorios")}</span>
        <AgendaReminders lang={lang} accent={accent} value={f.reminders} onChange={(v) => set("reminders", v)} />
      </div>
      <div>
        <span className="mb-1 block text-xs text-muted-foreground">{t(lang, "agenda.f.media")}</span>
        <AgendaMediaUpload lang={lang} accent={accent} tenantId={tenantId} value={f.media} onChange={(v) => set("media", v)} />
      </div>
    </div>
  );
}
