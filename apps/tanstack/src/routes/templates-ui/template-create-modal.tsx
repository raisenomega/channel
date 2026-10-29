/**
 * HUB by Raisen — Creador de plantilla en MODAL (mismo shell/tamano que la Ficha360 de contacto:
 * overlay fixed inset-0 + panel max-w-4xl max-h-[85vh] rounded-2xl bg-card). C4 <=75.
 */
import type { Idioma } from "@/lib/i18n";
import { TemplateCreateForm } from "./template-create-form";

export function TemplateCreateModal({ language, onClose, onCreated }: {
  language: Idioma;
  onClose: () => void;
  onCreated: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div className="flex max-h-[85vh] w-full max-w-4xl flex-col gap-3 overflow-y-auto rounded-2xl border border-border/50 bg-card p-5"
        onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start justify-between gap-2">
          <h3 className="text-lg font-bold text-foreground">Crear plantilla</h3>
          <button type="button" onClick={onClose} className="shrink-0 text-xl text-muted-foreground hover:text-foreground" aria-label="cerrar">{"×"}</button>
        </div>
        <TemplateCreateForm language={language} onCreated={() => { onCreated(); onClose(); }} />
      </div>
    </div>
  );
}
