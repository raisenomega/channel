/**
 * HUB by Raisen — D: compone la reconexion al cliente tras resolver una consulta/escalada. Autodraft CON
 * router -> en modo AUTONOMO AUTO-ENVIA (respeta los gates B/C); en SUPERVISADO deja BORRADOR para aprobar.
 * En ambos deja un draft de EVIDENCIA etiquetado (origen consulta/escalada). Lazy (el router es async) y
 * memoizado. Kill-switch RECONNECT_ON_RESOLVE=off lo apaga sin redeploy. C4 <=75.
 */
import { buildAutodraft } from "./autodraft-wrapper.ts";
import { buildChannelRouter } from "./channel-router-wrapper.ts";
import { ejecutarRobusto } from "./autodraft-robusto.ts";
import { leerConsulta } from "../cognition/infrastructure/agent-consulta.repo.ts";
import { datosReconexion } from "../cognition/infrastructure/reconexion.query.ts";
import { reconectarCliente } from "../cognition/application/reconnect-after-resolve.ts";
import { getEnv } from "../shared/infrastructure/supabase-rest.helper.ts";
import type { MaybeAutodraftService } from "../cognition/application/maybe-autodraft.service.ts";

export function buildReconnect(): ((tenantId: string, consultaId: string) => void) | undefined {
  if ((getEnv("RECONNECT_ON_RESOLVE") ?? "on") === "off") return undefined;
  let adP: Promise<MaybeAutodraftService> | null = null;
  const getAd = (): Promise<MaybeAutodraftService> => (adP ??= buildChannelRouter().then((r) => buildAutodraft(r)));
  const leerThread = async (t: string, c: string) => {
    const th = await leerConsulta(t, c);
    return th ? { conversationId: th.conversationId, agentSlug: th.agentSlug, tipo: th.tipo } : null;
  };
  return (tenantId, consultaId) => void (async () => {
    const ad = await getAd();
    await reconectarCliente({ leerThread, datos: datosReconexion, disparar: (ev) => void ejecutarRobusto(ad, ev) }, tenantId, consultaId);
  })();
}
