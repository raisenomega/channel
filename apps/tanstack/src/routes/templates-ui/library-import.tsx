/**
 * HUB by Raisen — Catalogo HUB (pre-aprobada): tarjetas estilo Borradores (4/fila) con estado REAL
 * de Meta. "Usar" crea/importa + marca el badge del chip de Canales + toast honesto. C4 <=75.
 */
import { useEffect, useState } from "react";
import type { Idioma } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { Toast } from "@/components/ui/toast";
import { importarLibrary } from "@/lib/templates-client/library-functions";
import { crearTemplate } from "@/lib/templates-client/functions";
import { estadoPlantillas } from "@/lib/templates-client/status-functions";
import { marcarPlantillaNueva } from "@/lib/plantillas-badge";
import { TEMPLATE_CATALOG, type CatalogItem } from "./template-catalog";
import { CatalogCard } from "./catalog-card";

function submitItem(item: CatalogItem, lang: string) {
  return item.imp
    ? importarLibrary(item.name, item.cat, lang)
    : crearTemplate({ name: item.name, language: lang, category: item.cat, body: item.body });
}

export function LibraryImport({ onImported }: { language?: Idioma; onImported: () => void }) {
  const [statuses, setStatuses] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState<string | null>(null);
  const [toast, setToast] = useState("");
  const refetch = () => void estadoPlantillas().then(setStatuses);
  useEffect(() => { refetch(); }, []);
  const aprobadas = TEMPLATE_CATALOG.filter((i) => statuses[i.name] === "APPROVED").length;

  async function usar(item: CatalogItem): Promise<void> {
    setBusy(item.name);
    const r = await submitItem(item, "es");
    setBusy(null);
    if (!r.ok) { setToast(`No se pudo enviar "${item.name}". Reintenta.`); return; }
    marcarPlantillaNueva(item.name);
    setToast(`"${item.name}" enviada. La veras en Canales > Plantillas cuando Meta la apruebe.`);
    onImported(); refetch();
  }

  async function usarTodas(): Promise<void> {
    setBusy("__all__"); let ok = 0;
    for (const item of TEMPLATE_CATALOG) {
      const r = await submitItem(item, "es");
      if (r.ok) { ok++; marcarPlantillaNueva(item.name); }
    }
    setBusy(null);
    setToast(`${ok}/${TEMPLATE_CATALOG.length} enviadas. En Canales > Plantillas cuando Meta apruebe.`);
    onImported(); refetch();
  }

  return (
    <div>
      <div className="mb-3 flex items-center justify-between gap-2">
        <h3 className="text-sm font-bold text-foreground">Catalogo HUB — {aprobadas} de {TEMPLATE_CATALOG.length} aprobadas</h3>
        <Button size="sm" loading={busy === "__all__"} onClick={() => void usarTodas()}>Usar todas</Button>
      </div>
      <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
        {TEMPLATE_CATALOG.map((item) => (
          <CatalogCard key={item.name} item={item} status={statuses[item.name]}
            busy={busy === item.name || busy === "__all__"} onUsar={(i) => void usar(i)} />
        ))}
      </div>
      {toast ? <Toast message={toast} onHide={() => setToast("")} ms={4000} /> : null}
    </div>
  );
}
