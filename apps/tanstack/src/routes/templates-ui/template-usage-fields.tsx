/**
 * HUB by Raisen — Panel izquierdo del modal de plantilla: campos con NOTAS honestas (que poner + limites
 * de Meta). Encabezado (texto o foto), cuerpo, boton con link, toggle ventana 24h. Todo editable (corregir
 * = escribir). Reporta cambios via set(). C4 <=75. Sin any.
 */
import { UsageField } from "./usage-field";
import { LIM, type UsageDraft, type HeaderMode } from "@/lib/templates-client/template-draft";

const INP = "h-10 w-full rounded-xl border border-border/55 bg-card-soft px-3 text-sm text-foreground";

export function TemplateUsageFields({ draft, aprobada, set }: {
  draft: UsageDraft; aprobada: boolean; set: (p: Partial<UsageDraft>) => void;
}) {
  return (
    <div className="space-y-3">
      <UsageField label="Encabezado (opcional)" nota="Un titulo corto o una foto arriba del mensaje. Si la plantilla aprobada no lo tenia, agregarlo requiere re-aprobacion de Meta.">
        <select value={draft.headerMode} onChange={(e) => set({ headerMode: e.target.value as HeaderMode })} className={INP}>
          <option value="none">Sin encabezado</option>
          <option value="text">Titulo de texto</option>
          <option value="image">Foto</option>
        </select>
      </UsageField>
      {draft.headerMode === "text" ? (
        <UsageField label="Titulo" nota="Texto corto del encabezado, maximo 60 caracteres." valor={draft.headerText} max={LIM.header}>
          <input value={draft.headerText} onChange={(e) => set({ headerText: e.target.value })} className={INP} placeholder="Ej: Tu pedido va en camino" />
        </UsageField>
      ) : null}
      {draft.headerMode === "image" ? (
        <UsageField label="Foto (URL)" nota="Enlace a una imagen JPG o PNG (hasta ~5MB; horizontal se ve mejor). Debe ser publica o de tu media.">
          <input value={draft.imageUrl} onChange={(e) => set({ imageUrl: e.target.value })} className={INP} placeholder="https://..." />
        </UsageField>
      ) : null}
      <UsageField label="Cuerpo del mensaje" valor={draft.body} max={LIM.body}
        nota={aprobada ? "Este es el texto APROBADO por Meta. Si lo cambias, la plantilla debera re-aprobarse. Maximo 1024 caracteres." : "El mensaje principal, claro y directo. Maximo 1024 caracteres."}>
        <textarea value={draft.body} onChange={(e) => set({ body: e.target.value })} rows={5} className="w-full rounded-xl border border-border/55 bg-card-soft px-3 py-2 text-sm text-foreground" />
      </UsageField>
      <UsageField label="Boton con link (opcional)" valor={draft.linkText} max={LIM.linkText}
        nota="Un boton que lleva a una pagina (tu sitio, un formulario). Texto del boton maximo 25 caracteres; la URL es a donde redirige.">
        <div className="grid grid-cols-2 gap-2">
          <input value={draft.linkText} onChange={(e) => set({ linkText: e.target.value })} className={INP} placeholder="Texto (ej: Ver pedido)" />
          <input value={draft.linkUrl} onChange={(e) => set({ linkUrl: e.target.value })} className={INP} placeholder="https://pagina-x..." />
        </div>
      </UsageField>
      <label className="flex items-start gap-2 text-sm text-foreground">
        <input type="checkbox" checked={draft.ventana24h} onChange={(e) => set({ ventana24h: e.target.checked })} className="mt-0.5" />
        <span>Dentro de la ventana de 24h. <span className="text-muted-foreground">Fuera de ella WhatsApp exige una plantilla aprobada para iniciar la conversacion.</span></span>
      </label>
    </div>
  );
}
