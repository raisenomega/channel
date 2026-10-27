/**
 * HUB by Raisen — Alerta al DUENO por WhatsApp (plantilla aprobada "alert_hub") cuando el agente
 * intenta ESCALAR. MULTI-TENANT: envia DESDE el sender WhatsApp del tenant
 * (channel_connections.zernio_account_id) AL telefono del negocio (tenants.phone, migr 045).
 * Usa el endpoint REAL de Zernio para abrir conversacion con plantilla a un numero sin hilo:
 * POST /v1/inbox/conversations { accountId, participantId, templateName, templateLanguage, templateParams }.
 * Fire-and-forget, fail-safe: sin telefono / sin sender / sin creds -> no-op; NUNCA bloquea la
 * respuesta al cliente. NO toca el flujo de disparo/cotizacion. C4 <=75. Sin any.
 */
import { supabase } from "../../shared/infrastructure/supabase.client.ts";
import { ZernioCredentialsRepository } from "../../channels/infrastructure/zernio.credentials.ts";

const PLANTILLA = "alert_hub"; // aprobada en Meta/Zernio; idioma es; vars: {{1}}=contacto {{2}}=resumen
const IDIOMA = "es";

async function senderWhatsApp(tenantId: string): Promise<string | null> {
  const { data } = await supabase.from("channel_connections")
    .select("zernio_account_id")
    .eq("tenant_id", tenantId).eq("platform", "whatsapp").eq("status", "connected").maybeSingle();
  return (data as { zernio_account_id?: string | null } | null)?.zernio_account_id ?? null;
}

export async function alertarDuenoWhatsApp(tenantId: string, contacto: string, resumen: string): Promise<void> {
  try {
    const { data: tRow } = await supabase.from("tenants").select("phone").eq("id", tenantId).maybeSingle();
    const phone = (tRow as { phone?: string | null } | null)?.phone;
    const accountId = await senderWhatsApp(tenantId); // sender WhatsApp del tenant (de SU negocio)
    if (!phone || !accountId) return; // sin telefono del negocio o sin sender WhatsApp: no hay a quien/desde donde
    const creds = await new ZernioCredentialsRepository().leer();
    if (!creds.ok) return;
    await fetch("https://zernio.com/api/v1/inbox/conversations", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${creds.value.apiKey}` },
      body: JSON.stringify({
        accountId, participantId: phone, templateName: PLANTILLA, templateLanguage: IDIOMA,
        templateParams: [contacto.slice(0, 120), resumen.slice(0, 300)],
      }),
    });
  } catch {
    /* fail-safe: la alerta al dueno nunca bloquea ni rompe la respuesta al cliente */
  }
}
