/**
 * HUB by Raisen — D: compone la reconexion al cliente tras resolver una consulta/escalada. Usa un autodraft
 * SIN router -> SOLO deja BORRADOR (nunca auto-envia; el dueno aprueba). Kill-switch RECONNECT_ON_RESOLVE=off
 * lo apaga sin redeploy (devuelve undefined -> el resolve no reconecta). C4 <=75.
 */
import { buildAutodraft } from "./autodraft-wrapper.ts";
import { ejecutarRobusto } from "./autodraft-robusto.ts";
import { leerConsulta } from "../cognition/infrastructure/agent-consulta.repo.ts";
import { datosReconexion } from "../cognition/infrastructure/reconexion.query.ts";
import { reconectarCliente } from "../cognition/application/reconnect-after-resolve.ts";
import { getEnv } from "../shared/infrastructure/supabase-rest.helper.ts";

export function buildReconnect(): ((tenantId: string, consultaId: string) => void) | undefined {
  if ((getEnv("RECONNECT_ON_RESOLVE") ?? "on") === "off") return undefined;
  const autodraft = buildAutodraft(); // sin router -> solo Borrador (no auto-envia a clientes reales)
  const leerThread = async (t: string, c: string) => {
    const th = await leerConsulta(t, c);
    return th ? { conversationId: th.conversationId, agentSlug: th.agentSlug } : null;
  };
  return (tenantId, consultaId) => void reconectarCliente(
    { leerThread, datos: datosReconexion, disparar: (ev) => void ejecutarRobusto(autodraft, ev) },
    tenantId, consultaId,
  );
}
