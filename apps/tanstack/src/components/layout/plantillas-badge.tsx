/**
 * HUB by Raisen — Badge del chip "Plantillas" en Canales: cuenta las plantillas que el tenant eligio
 * "Usar" y aun no ha visto en el chip (per-viewer). Se limpia al abrir el chip. Honesto. C4 <=75.
 */
import { useEffect, useState } from "react";
import { AlertBadge } from "@/components/ui/alert-badge";
import { contarPlantillasNuevas } from "@/lib/plantillas-badge";

export function PlantillasBadge() {
  const [n, setN] = useState(0);
  useEffect(() => {
    setN(contarPlantillasNuevas());
    const h = () => setN(contarPlantillasNuevas());
    window.addEventListener("plantillas-badge", h);
    return () => window.removeEventListener("plantillas-badge", h);
  }, []);
  return <AlertBadge count={n} />;
}
