/**
 * HUB by Raisen — Barra Enviar reutilizable (estilo CITA): canales (WA/IG/FB/Telegram/Email/LinkedIn)
 * + vista previa editable + envio REAL al hilo del contacto via Zernio, con reporte. C4 <=75.
 */
import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import type { Idioma } from "@/lib/i18n";
import { t } from "@/lib/i18n";
import { sendToContact } from "@/lib/send-to-contact";

const CH = [
  { id: "whatsapp", label: "WhatsApp" }, { id: "instagram", label: "Instagram" }, { id: "facebook", label: "Facebook" },
  { id: "telegram", label: "Telegram" }, { id: "email", label: "Email" }, { id: "linkedin", label: "LinkedIn" },
];
const Check = () => <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M5 13l4 4L19 7" /></svg>;

export function DocSendBar({ lang, contactId, initialMessage }: { lang: Idioma; contactId: string; initialMessage: string }) {
  const [sel, setSel] = useState<string[]>([]);
  const [msg, setMsg] = useState(initialMessage);
  const [res, setRes] = useState<{ sent: string[]; failed: string[] } | null>(null);
  const toggle = (id: string) => setSel((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));
  const m = useMutation({ mutationFn: () => sendToContact(contactId, sel, msg), onSuccess: setRes });
  return (
    <div className="border-t border-border/40 pt-3">
      <p className="mb-1 text-[11px] font-bold uppercase text-muted-foreground">{t(lang, "agenda.enviarPor")}</p>
      <div className="flex flex-wrap items-center gap-1.5">
        {CH.map((c) => { const on = sel.includes(c.id); return (
          <button key={c.id} type="button" onClick={() => toggle(c.id)} className={"chip inline-flex items-center gap-1 text-[11px]" + (on ? " active" : "")} style={on ? { color: "hsl(var(--primary))", borderColor: "hsl(var(--primary))" } : undefined}>{on && <Check />}{c.label}</button>
        ); })}
      </div>
      <p className="mb-1 mt-2 text-[11px] text-muted-foreground">{t(lang, "agenda.previa")}</p>
      <textarea className="w-full rounded-xl border border-border/55 bg-card-soft p-2 text-sm text-foreground" rows={4} value={msg} onChange={(e) => setMsg(e.target.value)} />
      <button type="button" className="chip mt-2 font-bold text-white" style={{ background: "hsl(var(--primary))" }} disabled={sel.length === 0 || m.isPending} onClick={() => m.mutate()}>{m.isPending ? t(lang, "onboarding.saving") : t(lang, "agenda.enviar")}</button>
      {res && <p className="mt-1 text-[11px]">{res.sent.length > 0 && <span className="text-green-500">{t(lang, "agenda.enviadoA")}: {res.sent.join(", ")}</span>}{res.failed.length > 0 && <span className="text-red-400">{res.sent.length > 0 ? " . " : ""}{t(lang, "agenda.noEnviado")}: {res.failed.join(", ")}</span>}</p>}
    </div>
  );
}
