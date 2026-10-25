/**
 * HUB by Raisen — B8: cascada de temperatura (checkmark dentro del chip elegido, en el color del chip) +
 * notas manuales (max 3, 300 chars) con autor + fecha/hora completa + borrar. Guardar/borrar via RPC;
 * onChange refresca. El agente tambien sube la temperatura solo (ver calificarTemperatura). C4 <=75.
 */
import { useState } from "react";
import type { Idioma } from "@/lib/i18n";
import { t } from "@/lib/i18n";
import { agregarNota, setTemperatura, eliminarNota, type ContactNote } from "./contact-detail-fetchers";

const TEMPS: Array<[string, string]> = [["frio", "205 70% 50%"], ["tibio", "40 90% 52%"], ["caliente", "20 85% 55%"], ["convertido", "145 60% 45%"]];

function Check({ c }: { c: string }) {
  return <span style={{ display: "inline-block", width: 5, height: 9, marginRight: 4, borderRight: `2px solid hsl(${c})`, borderBottom: `2px solid hsl(${c})`, transform: "rotate(45deg)" }} />;
}

export function ContactExtras({ lang, contactId, notes, temperature, onChange }: {
  lang: Idioma; contactId: string; notes: ContactNote[]; temperature: string | null; onChange: () => void;
}) {
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const fmt = (iso: string) => new Date(iso).toLocaleString(lang === "es" ? "es-ES" : "en-US", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
  const guardar = async () => { if (!draft.trim() || busy) return; setBusy(true); if (await agregarNota(contactId, draft.trim())) { setDraft(""); onChange(); } setBusy(false); };
  const setTemp = async (tp: string) => { if (await setTemperatura(contactId, tp)) onChange(); };
  const borrar = async (i: number) => { if (await eliminarNota(contactId, i)) onChange(); };
  return (
    <div className="shrink-0 space-y-2">
      <div>
        <p className="text-[11px] font-bold uppercase text-muted-foreground">{t(lang, "contacts.temperature")}</p>
        <div className="mt-1 flex gap-1.5">
          {TEMPS.map(([k, c]) => (
            <button key={k} type="button" onClick={() => void setTemp(k)} className="chip flex-1 text-[11px] font-bold" style={{ color: `hsl(${c})`, borderColor: temperature === k ? `hsl(${c})` : "hsl(var(--border))", background: temperature === k ? `hsl(${c} / 0.14)` : undefined }}>{temperature === k ? <Check c={c} /> : null}{t(lang, "contacts.temp." + k)}</button>
          ))}
        </div>
      </div>
      <div>
        <p className="text-[11px] font-bold uppercase text-muted-foreground">{t(lang, "contacts.notes")} ({notes.length}/3)</p>
        {notes.map((n, i) => (
          <div key={i} className="mt-1 flex items-start gap-2 rounded bg-muted/20 p-1.5 text-[11px]">
            <span className="mt-1"><Check c="145 60% 45%" /></span>
            <div className="min-w-0 flex-1"><p className="whitespace-pre-wrap break-words text-foreground">{n.text}</p><p className="mt-0.5 text-[10px] text-muted-foreground">{fmt(n.at)}{n.by ? ` · ${n.by}` : ""}</p></div>
            <button type="button" onClick={() => void borrar(i)} className="shrink-0 text-base leading-none text-muted-foreground hover:text-foreground" aria-label="x">{"×"}</button>
          </div>
        ))}
        {notes.length < 3 ? (
          <div className="mt-1 flex gap-2">
            <input value={draft} maxLength={300} onChange={(e) => setDraft(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); void guardar(); } }} placeholder={t(lang, "contacts.notePlaceholder")} className="flex-1 rounded border border-border/55 bg-card-soft p-1.5 text-xs text-foreground" />
            <button type="button" disabled={busy || !draft.trim()} onClick={() => void guardar()} className="chip font-bold text-white disabled:opacity-50" style={{ background: "hsl(var(--success))" }}>{t(lang, "ctx.save")}</button>
          </div>
        ) : null}
      </div>
    </div>
  );
}
