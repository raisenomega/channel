/**
 * HUB by Raisen — Catalogo HUB de plantillas (lote 1 = 25): "Usar" crea o importa.
 * imp -> import instantaneo (Meta); si no -> crea con cuerpo estatico. C4 <=75.
 */
import { useState } from "react";
import type { Idioma } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { importarLibrary } from "@/lib/templates-client/library-functions";
import { crearTemplate } from "@/lib/templates-client/functions";
import type { TemplateError } from "@/lib/templates-client/types";
import { TEMPLATE_CATALOG, type CatalogItem } from "./template-catalog";

function submitItem(item: CatalogItem, lang: string) {
  return item.imp
    ? importarLibrary(item.name, item.cat, lang)
    : crearTemplate({ name: item.name, language: lang, category: item.cat, body: item.body });
}

export function LibraryImport({ onImported }: { language?: Idioma; onImported: () => void }) {
  const [usarLang, setUsarLang] = useState("es");
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<TemplateError | null>(null);
  const [feedback, setFeedback] = useState("");

  async function usarUna(item: CatalogItem): Promise<void> {
    setError(null); setFeedback(""); setLoading(item.name);
    const r = await submitItem(item, usarLang);
    setLoading(null);
    if (!r.ok) { setError(r.error); return; }
    setFeedback(`"${item.name}" enviada a revision de Meta`); onImported();
  }

  async function usarTodas(): Promise<void> {
    setError(null); setLoading("__all__"); let okN = 0; let bad = 0;
    for (const item of TEMPLATE_CATALOG) {
      const r = await submitItem(item, usarLang);
      if (r.ok) { okN++; } else { bad++; }
      setFeedback(`Enviando ${okN + bad}/${TEMPLATE_CATALOG.length} (${okN} ok, ${bad} con error)`);
    }
    setLoading(null); onImported();
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-1 gap-2">
        <h3 className="text-sm font-bold">Catalogo HUB — {TEMPLATE_CATALOG.length} plantillas</h3>
        <Button size="sm" loading={loading === "__all__"} onClick={() => void usarTodas()}>Usar todas</Button>
      </div>
      <div className="flex items-center gap-2 mb-3">
        <span className="text-xs text-muted-foreground">Idioma:</span>
        <input type="text" value={usarLang} onInput={(e) => setUsarLang(e.currentTarget.value)}
          className="rounded-xl glass-card px-2 py-1 text-sm w-20" />
      </div>
      <div className="flex flex-col gap-2">
        {TEMPLATE_CATALOG.map((item) => (
          <div key={item.name} className="flex items-center gap-3 rounded-2xl glass-card px-4 py-3">
            <div className="flex-1 min-w-0">
              <strong className="text-sm">{item.name}</strong>
              <span className="ml-2 text-[10px] uppercase text-muted-foreground">{item.cat}{item.imp ? " - meta" : ""}</span>
              <span className="block text-xs text-muted-foreground truncate">{item.desc}</span>
            </div>
            <Button variant="outline" size="sm" loading={loading === item.name} onClick={() => void usarUna(item)}>Usar</Button>
          </div>
        ))}
      </div>
      {error ? <p className="text-xs text-critical mt-2">{error.kind === "validation" ? `No se pudo (${error.cause ?? "revisa"})` : "Error al enviar."}</p> : null}
      {feedback ? <p className="text-xs text-success mt-2">{feedback}</p> : null}
    </div>
  );
}
