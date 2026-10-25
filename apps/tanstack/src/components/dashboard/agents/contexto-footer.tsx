/**
 * HUB by Raisen — Pie del editor de Contexto (6 partes). Pasos 1-5: boton Siguiente. Paso 6: [Borrar todo]
 * (abre dialogo de advertencia) + [Guardar]. Borrar vacia las 6 partes en la BD para empezar de cero. C4 <=75.
 */
import { useState } from "react";
import { t, type Idioma } from "@/lib/i18n";

export function ContextoFooter({ lang, accent, step, busy, saved, onNext, onSave, onClear }: {
  lang: Idioma; accent: string; step: number; busy: boolean; saved: boolean;
  onNext: () => void; onSave: () => void; onClear: () => void;
}) {
  const [ask, setAsk] = useState(false);
  if (step < 6) {
    return <button type="button" onClick={onNext} className="chip ml-auto font-bold" style={{ color: `hsl(${accent})`, borderColor: `hsl(${accent})` }}>{t(lang, "ctx.next")} {"›"}</button>;
  }
  const red = "hsl(0 72% 55%)";
  return (
    <div className="ml-auto flex items-center gap-3">
      <button type="button" disabled={busy} onClick={() => setAsk(true)} className="chip font-bold" style={{ color: red, borderColor: red }}>{t(lang, "ctx.clear")}</button>
      <button type="button" onClick={onSave} disabled={busy} className="chip font-bold text-white" style={{ background: `hsl(${accent})` }}>{busy ? t(lang, "ctx.saving") : t(lang, "ctx.save")}</button>
      {saved ? <span className="text-xs font-semibold" style={{ color: "hsl(var(--success))" }}>{t(lang, "ctx.saved")}</span> : null}
      {ask ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setAsk(false)}>
          <div className="w-full max-w-sm space-y-3 rounded-2xl border border-border/50 bg-card p-5" onClick={(e) => e.stopPropagation()}>
            <p className="text-sm font-bold text-foreground">{t(lang, "ctx.clearConfirm")}</p>
            <div className="flex gap-2">
              <button type="button" onClick={() => { setAsk(false); onClear(); }} className="chip flex-1 font-bold text-white" style={{ background: red }}>{t(lang, "ctx.clearYes")}</button>
              <button type="button" onClick={() => setAsk(false)} className="chip flex-1 font-bold">{t(lang, "ctx.cancel")}</button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
