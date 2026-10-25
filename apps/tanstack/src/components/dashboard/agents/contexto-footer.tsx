/**
 * HUB by Raisen — Pie del editor de Contexto (6 partes). Pasos 1-5: boton Siguiente. Paso 6: [Borrar todo]
 * (doble-clic para confirmar, sin dialogo bloqueante) + [Guardar]. Borrar vacia las 6 partes para empezar
 * de cero con datos frescos. C4 <=75.
 */
import { useState } from "react";
import { t, type Idioma } from "@/lib/i18n";

export function ContextoFooter({ lang, accent, step, busy, saved, onNext, onSave, onClear }: {
  lang: Idioma; accent: string; step: number; busy: boolean; saved: boolean;
  onNext: () => void; onSave: () => void; onClear: () => void;
}) {
  const [sure, setSure] = useState(false);
  if (step < 6) {
    return <button type="button" onClick={onNext} className="chip ml-auto font-bold" style={{ color: `hsl(${accent})`, borderColor: `hsl(${accent})` }}>{t(lang, "ctx.next")} {"›"}</button>;
  }
  const red = "hsl(0 72% 55%)";
  return (
    <div className="ml-auto flex items-center gap-3">
      <button type="button" disabled={busy} onClick={() => { if (sure) { setSure(false); onClear(); } else setSure(true); }} className="chip font-bold" style={{ color: red, borderColor: red }}>{sure ? t(lang, "ctx.clearSure") : t(lang, "ctx.clear")}</button>
      <button type="button" onClick={onSave} disabled={busy} className="chip font-bold text-white" style={{ background: `hsl(${accent})` }}>{busy ? t(lang, "ctx.saving") : t(lang, "ctx.save")}</button>
      {saved ? <span className="text-xs font-semibold" style={{ color: "hsl(var(--success))" }}>{t(lang, "ctx.saved")}</span> : null}
    </div>
  );
}
