/**
 * HUB by Raisen — B8: cascada de temperatura (Frio/Tibio/Caliente/Convertido) + notas manuales (max 3, 300
 * chars) dentro de la ficha del contacto. Guardar via RPC; onChange refresca. C4 <=75.
 */
import { useState } from "react";
import type { Idioma } from "@/lib/i18n";
import { t } from "@/lib/i18n";
import { agregarNota, setTemperatura, type ContactNote } from "./contact-detail-fetchers";

const TEMPS: Array<[string, string]> = [["frio", "205 70% 50%"], ["tibio", "40 90% 52%"], ["caliente", "20 85% 55%"], ["convertido", "145 60% 45%"]];

export function ContactExtras({ lang, contactId, notes, temperature, onChange }: {
  lang: Idioma; contactId: string; notes: ContactNote[]; temperature: string | null; onChange: () => void;
}) {
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const guardar = async () => { if (!draft.trim() || busy) return; setBusy(true); if (await agregarNota(contactId, draft.trim())) { setDraft(""); onChange(); } setBusy(false); };
  const setTemp = async (tp: string) => { if (await setTemperatura(contactId, tp)) onChange(); };
  return (
    <div className="shrink-0 space-y-2">
      <div>
        <p className="text-[11px] font-bold uppercase text-muted-foreground">{t(lang, "contacts.temperature")}</p>
        <div className="mt-1 flex gap-1.5">
          {TEMPS.map(([k, c]) => (
            <button key={k} type="button" onClick={() => void setTemp(k)} className="chip flex-1 text-[11px] font-bold" style={{ color: `hsl(${c})`, borderColor: temperature === k ? `hsl(${c})` : "hsl(var(--border))", background: temperature === k ? `hsl(${c} / 0.14)` : undefined }}>{t(lang, "contacts.temp." + k)}</button>
          ))}
        </div>
      </div>
      <div>
        <p className="text-[11px] font-bold uppercase text-muted-foreground">{t(lang, "contacts.notes")} ({notes.length}/3)</p>
        {notes.map((n, i) => <p key={i} className="mt-1 rounded bg-muted/20 p-1.5 text-[11px] text-foreground">{n.text}</p>)}
        {notes.length < 3 ? (
          <div className="mt-1 flex gap-2">
            <input value={draft} maxLength={300} onChange={(e) => setDraft(e.target.value)} placeholder={t(lang, "contacts.notePlaceholder")} className="flex-1 rounded border border-border/55 bg-card-soft p-1.5 text-xs text-foreground" />
            <button type="button" disabled={busy || !draft.trim()} onClick={() => void guardar()} className="chip font-bold text-white disabled:opacity-50" style={{ background: "hsl(var(--success))" }}>{t(lang, "ctx.save")}</button>
          </div>
        ) : null}
      </div>
    </div>
  );
}
