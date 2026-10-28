/**
 * HUB by Raisen — Dialogo de resolucion: al apretar [Solucionado] se pide "quien atendio" (+ nota),
 * y [Guardar] marca la conversacion resuelta con datos REALES (sin mock). Prellena con tu usuario. C4 <=75.
 */
import { useState, useEffect } from "react";
import type { Idioma } from "@/lib/i18n";
import { t } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { readLocalSession } from "@/lib/auth";

export function ResolveDialog({ open, language, saving, onGuardar, onClose }: {
  open: boolean; language: Idioma; saving: boolean;
  onGuardar: (atendio: string, nota: string) => void; onClose: () => void;
}) {
  const [atendio, setAtendio] = useState("");
  const [nota, setNota] = useState("");
  useEffect(() => { if (open) { setAtendio(readLocalSession()?.user?.email ?? ""); setNota(""); } }, [open]);
  if (!open) return null;
  const input = "mt-1 w-full rounded border border-border/55 bg-card-soft p-2 text-sm text-foreground";
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={onClose}>
      <div className="w-full max-w-md rounded-2xl glass-card p-4" onClick={(e) => e.stopPropagation()}>
        <h3 className="mb-3 font-display text-base font-bold text-foreground">{t(language, "resueltos.dialogoTitulo")}</h3>
        <label className="text-xs text-muted-foreground">{t(language, "resueltos.quienAtendio")}</label>
        <input value={atendio} onChange={(e) => setAtendio(e.target.value)} className={input + " mb-3"} />
        <label className="text-xs text-muted-foreground">{t(language, "resueltos.nota")}</label>
        <textarea value={nota} onChange={(e) => setNota(e.target.value)} rows={2} className={input + " mb-3 resize-none"} />
        <div className="flex justify-end gap-2">
          <Button variant="ghost" size="sm" onClick={onClose}>{t(language, "resueltos.cancelar")}</Button>
          <Button variant="primary" size="sm" disabled={saving || !atendio.trim()} onClick={() => onGuardar(atendio.trim(), nota.trim())}>{t(language, "resueltos.guardar")}</Button>
        </div>
      </div>
    </div>
  );
}
