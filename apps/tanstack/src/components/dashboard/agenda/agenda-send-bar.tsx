/**
 * HUB by Raisen — Barra Enviar: elige WA/IG/FB (una o varias vias) y pone la cita en cola.
 * El envio real se dispara con Railway. Checkmark via SVG (sin emoji). C4 <=75.
 */
import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { Idioma } from "@/lib/i18n";
import { t } from "@/lib/i18n";
import { queueSend } from "./agenda-send";
import type { RowAppointment } from "./agenda-types";

const CH = [{ id: "whatsapp", label: "WhatsApp" }, { id: "instagram", label: "Instagram" }, { id: "facebook", label: "Facebook" }];
const Check = () => <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M5 13l4 4L19 7" /></svg>;

export function AgendaSendBar({ lang, accent, appt }: { lang: Idioma; accent: string; appt: RowAppointment }) {
  const qc = useQueryClient();
  const [sel, setSel] = useState<string[]>(appt.send_channels ?? []);
  const toggle = (id: string) => setSel((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));
  const m = useMutation({ mutationFn: () => queueSend(appt.id, sel), onSuccess: (r) => { if (r.ok) void qc.invalidateQueries({ queryKey: ["agenda"] }); } });
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
        <button type="button" className="chip font-bold text-white" style={{ background: `hsl(${accent})` }} disabled={sel.length === 0 || m.isPending} onClick={() => m.mutate()}>
          {m.isPending ? t(lang, "onboarding.saving") : t(lang, "agenda.enviar")}
        </button>
      </div>
      {queued.length > 0 && <p className="mt-1 text-[11px] text-muted-foreground">{t(lang, "agenda.enCola")}: {queued.join(", ")}</p>}
    </div>
  );
}
