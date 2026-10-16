/**
 * HUB by Raisen — Importacion de library pre-aprobada de Meta (Slide 4.9).
 * C4 <=75. Lista estatica de plantillas pre-aprobadas + boton importar.
 */
import { useState } from "react";
import { t } from "@/lib/i18n";
import type { Idioma } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { importarLibrary } from "@/lib/templates-client/library-functions";
import type { TemplateError } from "@/lib/templates-client/types";

const LIBRARY_ITEMS: readonly { name: string; desc: string }[] = [
  { name: "recogido_manana", desc: "Recogido mañana (recordatorio cita)" },
  { name: "confirmacion_pedido", desc: "Confirmación de pedido" },
  { name: "aviso_pago", desc: "Aviso de pago recibido" },
  { name: "bienvenida_cliente", desc: "Mensaje de bienvenida" },
  { name: "alerta_envio", desc: "Alerta de envío en camino" },
];

export function LibraryImport({ language, onImported }: {
  language: Idioma;
  onImported: () => void;
}) {
  const [importLang, setImportLang] = useState("es");
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<TemplateError | null>(null);
  const [feedback, setFeedback] = useState("");

  async function handleImport(nombre: string): Promise<void> {
    setError(null);
    setFeedback("");
    setLoading(nombre);
    const r = await importarLibrary(nombre, importLang);
    setLoading(null);
    if (!r.ok) { setError(r.error); return; }
    setFeedback(t(language, "templates.library.success"));
    onImported();
  }

  return (
    <div>
      <h3 className="text-sm font-bold mb-2">{t(language, "templates.library.title")}</h3>
      <div className="flex items-center gap-2 mb-3">
        <span className="text-xs text-muted-foreground">{t(language, "templates.library.chooseLang")}:</span>
        <input type="text" value={importLang} onInput={(e) => setImportLang(e.currentTarget.value)}
          className="rounded-xl glass-card px-2 py-1 text-sm w-20" />
      </div>
      <div className="flex flex-col gap-2">
        {LIBRARY_ITEMS.map((item) => (
          <div key={item.name} className="flex items-center gap-3 rounded-2xl glass-card px-4 py-3">
            <div className="flex-1">
              <strong className="text-sm">{item.name}</strong>
              <span className="block text-xs text-muted-foreground">{item.desc}</span>
            </div>
            <Button variant="outline" size="sm" loading={loading === item.name}
              onClick={() => void handleImport(item.name)}>
              {t(language, "templates.library.import")}
            </Button>
          </div>
        ))}
      </div>
      {error ? <p className="text-xs text-critical mt-2">{
        error.kind === "validation" ? "No encontrada en library" : t(language, "templates.create.error")
      }</p> : null}
      {feedback ? <p className="text-xs text-success mt-2">{feedback}</p> : null}
    </div>
  );
}