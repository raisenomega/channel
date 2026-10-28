/**
 * HUB by Raisen — Actividad completa (/actividad): lista TODA la actividad del tenant (no solo las 5
 * de la tarjeta). Reusa ActivityRow: clic en consulta -> scope agente (c:{id}), en cliente -> conversacion.
 * Datos REALES via GET /tenants/:id/activity/all (service-role). C4 <=75.
 */
import { createRoute, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { rootRoute } from "@/app/root";
import { usePreferences } from "@/app/preferences";
import { t } from "@/lib/i18n";
import { apiFetch, resolveTenantId } from "@/lib/api-client";
import { ActivityRow, type ActivityEvent } from "@/components/dashboard/bentobox/bento-actividad-reciente";

async function fetchAllActivity(): Promise<ActivityEvent[]> {
  const tid = resolveTenantId();
  if (!tid) return [];
  try {
    const res = await apiFetch(`/tenants/${encodeURIComponent(tid)}/activity/all`);
    if (!res.ok) return [];
    const data = (await res.json()) as { events?: ActivityEvent[] };
    return data.events ?? [];
  } catch {
    return [];
  }
}

function ActividadPage() {
  const { language } = usePreferences();
  const navigate = useNavigate();
  const { data } = useQuery({ queryKey: ["activity-all"], queryFn: fetchAllActivity, refetchInterval: 15000 });
  const rows = data ?? [];
  return (
    <div className="view">
      <h2 className="mt-4 mb-3 font-display text-lg font-bold text-foreground">{t(language, "dash.actividadReciente")}</h2>
      <div className="rounded-2xl glass-card p-4">
        {rows.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t(language, "dash.sinActividad")}</p>
        ) : (
          <ul className="flex flex-col">
            {rows.map((e) => (
              <li key={e.id} className="border-b border-border/20 last:border-0">
                <ActivityRow e={e} onOpen={(id) => void navigate({ to: "/inbox/" + id })} />
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

const ActividadRoute = createRoute({ getParentRoute: () => rootRoute, path: "/actividad", component: ActividadPage });
export { ActividadRoute };
