/**
 * HUB by Raisen — Pagina Contexto como wizard de 5 partes (una pantalla por parte, flechas ‹ ›). El
 * dueno llena su negocio paso a paso; los 7 agentes lo leen (facts). Verde del chip > 70%. C4 <=75.
 */
import { useState, useEffect, useCallback } from "react";
import { t, type Idioma } from "@/lib/i18n";
import { apiFetch, resolveTenantId } from "@/lib/api-client";
import { CTX_FIELDS, CTX_PARTS } from "./contexto-fields";
import { ContextoField } from "./contexto-field";
import { ContextoAgentsStrip } from "./contexto-agents-strip";

type Vals = Record<string, string>;
interface Resp { context?: Record<string, unknown>; completeness?: { percent: number; green: boolean } }

export function ContextoPage({ lang, accent }: { lang: Idioma; accent: string }) {
  const [vals, setVals] = useState<Vals>({});
  const [pct, setPct] = useState(0);
  const [green, setGreen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);
  const [step, setStep] = useState(1);
  const tid = resolveTenantId();
  const apply = (d: Resp) => {
    const c = d.context ?? {};
    const v: Vals = {};
    for (const f of CTX_FIELDS) { const x = c[f.key]; v[f.key] = typeof x === "string" ? x : ""; }
    setVals(v); setPct(d.completeness?.percent ?? 0); setGreen(d.completeness?.green ?? false);
  };
  const load = useCallback(async () => {
    if (!tid) return;
    try { const r = await apiFetch(`/tenants/${encodeURIComponent(tid)}/context`); if (r.ok) apply((await r.json()) as Resp); } catch { /* */ }
  }, [tid]);
  useEffect(() => { void load(); }, [load]);
  const save = async () => {
    if (!tid || busy) return;
    setBusy(true); setSaved(false);
    try { const r = await apiFetch(`/tenants/${encodeURIComponent(tid)}/context`, { method: "PUT", body: JSON.stringify(vals) }); if (r.ok) { apply((await r.json()) as Resp); setSaved(true); } } catch { /* */ }
    setBusy(false);
  };
  const set = (k: string, v: string) => { setVals((o) => ({ ...o, [k]: v })); setSaved(false); };
  const move = (d: number) => setStep((sx) => Math.min(5, Math.max(1, sx + d)));
  const part = CTX_PARTS.find((p) => p.n === step) ?? CTX_PARTS[0]!;
  const dim = green ? "hsl(var(--success))" : "hsl(var(--text-dim))";
  return (
    <div className="space-y-3">
      <header>
        <div className="flex items-center gap-2">
          <h3 className="text-lg font-bold text-foreground">{t(lang, "ctx.title")}</h3>
          <span className="inline-block h-2 w-2 rounded-full" style={{ background: dim }} />
          <span className="text-sm font-bold" style={{ color: dim }}>{pct}{t(lang, "ctx.pct")}</span>
        </div>
        <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-muted/40"><div className="h-full rounded-full" style={{ width: `${pct}%`, background: green ? "hsl(var(--success))" : `hsl(${accent})` }} /></div>
      </header>
      <div className="flex items-center gap-2">
        <button type="button" onClick={() => move(-1)} disabled={step === 1} className="chip shrink-0 px-2 font-bold disabled:opacity-40" aria-label="prev">{"‹"}</button>
        <div className="flex-1 text-center">
          <p className="text-sm font-bold" style={{ color: `hsl(${accent})` }}>{t(lang, "ctx.part")} {step}/5 · {t(lang, part.title)}</p>
          <div className="mt-1 flex justify-center gap-1">{CTX_PARTS.map((p) => <span key={p.n} className="h-1.5 w-1.5 rounded-full" style={{ background: p.n === step ? `hsl(${accent})` : "hsl(var(--text-dim))" }} />)}</div>
        </div>
        <button type="button" onClick={() => move(1)} disabled={step === 5} className="chip shrink-0 px-2 font-bold disabled:opacity-40" aria-label="next">{"›"}</button>
      </div>
      <div className="grid min-h-[170px] grid-cols-1 gap-2 sm:grid-cols-2">
        {CTX_FIELDS.filter((f) => f.part === step).map((f) => <ContextoField key={f.key} lang={lang} field={f} value={vals[f.key] ?? ""} onChange={set} />)}
      </div>
      <div className="flex items-center gap-3">
        <button type="button" onClick={() => void save()} disabled={busy} className="chip font-bold text-white" style={{ background: `hsl(${accent})` }}>{busy ? t(lang, "ctx.saving") : t(lang, "ctx.save")}</button>
        {saved ? <span className="text-xs font-semibold" style={{ color: "hsl(var(--success))" }}>{t(lang, "ctx.saved")}</span> : null}
        {step < 5 ? <button type="button" onClick={() => move(1)} className="chip ml-auto font-bold" style={{ color: `hsl(${accent})`, borderColor: `hsl(${accent})` }}>{t(lang, "ctx.next")} {"›"}</button> : null}
      </div>
      {step === 5 ? <ContextoAgentsStrip lang={lang} /> : null}
    </div>
  );
}
