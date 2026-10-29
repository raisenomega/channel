/**
 * HUB by Raisen — "Mis templates" EN VIVO desde Meta (via /templates/status): muestra TODAS las
 * plantillas reales del numero con su estado y contenido. Boton Crear abre el modal Ficha360. C4 <=75.
 */
import { useEffect, useState } from "react";
import { t, type Idioma } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import type { WhatsAppTemplate } from "@/lib/templates-client/types";
import { plantillasReales } from "@/lib/templates-client/status-functions";
import { TemplatesList } from "./templates-list";
import { TemplateCreateModal } from "./template-create-modal";

export function MisPlantillasLive({ language }: { language: Idioma }) {
  const [items, setItems] = useState<WhatsAppTemplate[]>([]);
  const [crear, setCrear] = useState(false);
  const [cargando, setCargando] = useState(true);
  const load = () => { void plantillasReales().then((r) => { setItems(r); setCargando(false); }); };
  useEffect(() => { load(); }, []);

  return (
    <>
      <div className="mb-3 flex items-center justify-between gap-2">
        <span className="text-xs text-muted-foreground">{items.length} en tu numero de WhatsApp</span>
        <Button variant="primary" size="sm" onClick={() => setCrear(true)}>{t(language, "templates.create.title")}</Button>
      </div>
      <TemplatesList language={language} templates={cargando ? [] : items} syncFailed={false} />
      {crear ? <TemplateCreateModal language={language} onClose={() => setCrear(false)} onCreated={load} /> : null}
    </>
  );
}
