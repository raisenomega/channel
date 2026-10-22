/**
 * HUB by Raisen — Barra Enviar: canales (WA/IG/FB/Telegram/Email/LinkedIn, checkmark SVG) + vista
 * previa editable del mensaje; al enviar pone la cita en cola (canales + mensaje). C4 <=75.
 */
import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { Idioma } from "@/lib/i18n";
import { t } from "@/lib/i18n";
import { INP } from "./agenda-form-ui";
import { queueSend, defaultSendMessage } from "./agenda-send";
import type { RowAppointment } from "./agenda-types";

const CH = [
  { id: "whatsapp", label: "WhatsApp" }, { id: "instagram", label: "Instagram" }, { id: "facebook", label: "Facebook" },
  { id: "telegram", label: "Telegram" }, { id: "email", label: "Email" }, { id: "linkedin", label: "LinkedIn" },
];
const Check = () => <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M5 13l4 4L19 7" /></svg>;

export function AgendaSendBar({ lang, accent, appt, contactName }: {
  lang: Idioma; accent: string; appt: RowAppointment; contactName: string;
}) {
  const qc = useQueryClient();
  const [sel, setSel] = useState<string[]>(appt.send_channels ?? []);
  const [msg, setMsg] = useState<string>(appt.send_message || defaultSendMessage(lang, appt, contactName));
  const toggle = (id: string) => setSel((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));
  const m = useMutation({ mutationFn: () => queueSend(appt.id, sel, msg), onSuccess: (r) => { if (r.ok) void qc.invalidateQueries({ queryKey: ["agenda"] }); } });
  const queued = appt.send_channels ?? [];
  return (
    <div className="mt-3 border-t border-border/40 pt-3">
      <p className="mb-1 text-[11px] font-bold uppercase text-muted-foreground">{t(lang, "agenda.enviarPor")}</p>
      <div className="flex flex-wrap items-center gap-1.5">
        {CH.map((c) => {
          const on = sel.includes(c.id);
          return (
            <button key={c.id} type="button" onClick={() => toggle(c.id)} className={"chip inline-flex items-center gap-1 text-[11px]" + (on ? " active" : "")} style={on ? { color: `hsl(${accent})`, borderColor: `hsl(${accent})` } : undefined}>
              {on && <Check />}{c.label}
            </button>
          );
        })}
      </div>
      <p className="mb-1 mt-2 text-[11px] text-muted-foreground">{t(lang, "agenda.previa")}</p>
      <textarea className={INP} rows={3} value={msg} onChange={(e) => setMsg(e.target.value)} />
      <div className="mt-2 flex items-center gap-2">
        <button type="button" className="chip font-bold text-white" style={{ background: `hsl(${accent})` }} disabled={sel.length === 0 || m.isPending} onClick={() => m.mutate()}>
          {m.isPending ? t(lang, "onboarding.saving") : t(lang, "agenda.enviar")}
        </button>
        {queued.length > 0 && <span className="text-[11px] text-muted-foreground">{t(lang, "agenda.enCola")}: {queued.join(", ")}</span>}
      </div>
    </div>
  );
}
