/**
 * HUB by Raisen — Flujo de onboarding (crear tenant) del bootstrap.
 */
import { logger } from "@shared/infrastructure/logger.infrastructure.ts";
import { auth, type SessionUsuario } from "./auth-client.ts";
import { crearTenant } from "./onboarding-client.ts";
import { montarOnboarding } from "./onboarding-view.ts";
import { sessionConTenant, mensajeOnboarding, causaDe } from "./main-helpers.ts";

const FASE = "FASE_F";

export function manejarOnboarding(
  root: HTMLElement,
  sesion: SessionUsuario,
  continua: (ses: SessionUsuario) => void,
  salir: () => void,
): void {
  montarOnboarding(root, async (datos) => {
    const res = await crearTenant(sesion, datos);
    if (!res.ok) {
      const causa = causaDe(res.error);
      logger.error("onboarding_fallo", { fase: FASE, uid: sesion.uid, ...(causa ? { causa } : {}) });
      return mensajeOnboarding(res.error.kind, res.error.kind === "validacion" ? causa : undefined);
    }
    logger.info("tenant_creado", { fase: FASE, uid: sesion.uid, tenantId: res.value });
    auth.guardar({ ...sesion, tenant: { tenantId: res.value, name: datos.tenantName, plan: datos.plan, slug: datos.slug } });
    continua(sessionConTenant(sesion, res.value, datos));
    return null;
  }, async () => {
    await salir();
  });
}