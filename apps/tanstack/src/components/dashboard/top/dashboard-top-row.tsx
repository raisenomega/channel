/**
 * HUB by Raisen — Fila superior del dashboard (debajo del header), alineada a las 4 tarjetas KPI.
 * 4 celdas bento-col-3: [Crear mi negocio (la barra actual, solo reducida)] · [Canales (iconos)] ·
 * [Chips de estado] · [Llamada verde/rojo]. NO toca la barra de filtros actual (se prueba primero). C4 <=75.
 */
import { useQuery } from "@tanstack/react-query";
import type { Idioma } from "@/lib/i18n";
import { fetchMiTenantInfo } from "@/lib/tenant-client/mi-tenant-info";
import { RegistroWhatsApp } from "@/components/dashboard/registro/registro-whatsapp";
import { TopChannelsBar } from "./top-channels-bar";
import { TopStatusBar } from "./top-status-bar";
import { TopCallBar } from "./top-call-bar";

export function DashboardTopRow({ language, filtroEstado, filtroSLA, onEstado, onSLA, onClean, onCanalNav }: {
  language: Idioma;
  filtroEstado: string | null;
  filtroSLA: boolean | null;
  onEstado: (e: string) => void;
  onSLA: () => void;
  onClean: () => void;
  onCanalNav: (c: string) => void;
}) {
  const { data: miTenant, refetch } = useQuery({ queryKey: ["mi-tenant"], queryFn: fetchMiTenantInfo, staleTime: 60_000 });
  return (
    <div className="bento">
      <div className="bento-col-3">
        <RegistroWhatsApp language={language}
          tenant={miTenant ? { id: miTenant.tenantId, name: miTenant.name, plan: miTenant.plan } : null}
          onDone={() => void refetch()} />
      </div>
      <TopChannelsBar onCanalNav={onCanalNav} />
      <TopStatusBar lang={language} filtroEstado={filtroEstado} filtroSLA={filtroSLA} onEstado={onEstado} onSLA={onSLA} onClean={onClean} />
      <TopCallBar lang={language} />
    </div>
  );
}
