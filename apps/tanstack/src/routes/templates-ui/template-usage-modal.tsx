/**
 * HUB by Raisen — Modal AVANZADO de uso de plantilla (pantalla grande): panel izq = campos con notas
 * honestas; panel der = PREVIEW EN VIVO (WA/IG/FB) del render final al enviar. Sin cambios -> "lista para
 * usar"; con header/foto/link nuevos o body cambiado -> "enviar a aprobar" (Meta). NO auto-envia. C4 <=75.
 */
import { useState } from "react";
import type { ChannelKind } from "@/components/ui/channel-icon";
import { Button } from "@/components/ui/button";
import type { CatalogItem } from "./template-catalog";
import { draftInicial, requiereAprobacion, fueraDeLimite, type UsageDraft } from "@/lib/templates-client/template-draft";
import { TemplateUsageFields } from "./template-usage-fields";
import { TemplatePreview } from "./template-preview";

export function TemplateUsageModal({ item, aprobada, onClose, onGuardar }: {
  item: CatalogItem; aprobada: boolean; onClose: () => void;
  onGuardar: (d: UsageDraft, requiereApr: boolean) => void;
}) {
  const [draft, setDraft] = useState<UsageDraft>(draftInicial(item.name, item.body));
  const [canal, setCanal] = useState<ChannelKind>("whatsapp");
  const set = (p: Partial<UsageDraft>) => setDraft((d) => ({ ...d, ...p }));
  const over = fueraDeLimite(draft);
  const reqApr = requiereAprobacion(draft, item.body);
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div className="flex max-h-[92vh] w-full max-w-6xl flex-col gap-3 overflow-y-auto rounded-2xl border border-border/50 bg-card p-5" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start justify-between gap-2">
          <div>
            <h3 className="text-lg font-bold text-foreground">Usar plantilla: {item.name}</h3>
            <p className="max-w-xl text-xs leading-snug text-muted-foreground">Rellena los campos; a la derecha ves como se vera al enviar. {reqApr ? "Cambiaste/agregaste contenido: requerira aprobacion de Meta (no queda lista al instante)." : "Sin cambios: queda lista para usar al guardar."}</p>
          </div>
          <button type="button" onClick={onClose} className="shrink-0 text-xl text-muted-foreground hover:text-foreground" aria-label="cerrar">{"×"}</button>
        </div>
        <div className="grid gap-5 lg:grid-cols-2">
          <TemplateUsageFields draft={draft} aprobada={aprobada} set={set} />
          <TemplatePreview draft={draft} canal={canal} onCanal={setCanal} />
        </div>
        <div className="flex flex-wrap items-center justify-end gap-2 border-t border-border/40 pt-3">
          {over ? <span className="mr-auto text-xs font-semibold text-red-500">Revisa los limites de caracteres antes de continuar.</span> : null}
          <Button variant="ghost" onClick={onClose}>Cancelar</Button>
          <Button variant="primary" disabled={over || !draft.body.trim()} onClick={() => onGuardar(draft, reqApr)}>{reqApr ? "Enviar a aprobar" : "Guardar (lista para usar)"}</Button>
        </div>
      </div>
    </div>
  );
}
