/**
 * HUB by Raisen — Alerta al DUENO por WhatsApp (plantilla aprobada "alert_hub") cuando el agente
 * intenta ESCALAR a humano. Lee tenants.phone (Datos del negocio, migr 045) y envia via Zernio
 * sendTemplate. Fire-and-forget, fail-safe: NUNCA bloquea ni rompe la respuesta al cliente.
 * C4 <=75. Sin any. NO toca el flujo de disparo/cotizacion.
 */
import { supabase } from "../../shared/infrastructure/supabase.client.ts";
import { ZernioCredentialsRepository } from "../../channels/infrastructure/zernio.credentials.ts";
import { ZernioAdapter } from "../../channels/infrastructure/zernio.adapter.ts";

const PLANTILLA = "alert_hub"; // aprobada en Meta/Zernio, idioma es, 2 vars: {{1}}=contacto {{2}}=resumen

export async function alertarDuenoWhatsApp(tenantId: string, contacto: string, resumen: string): Promise<void> {
  try {
    const { data } = await supabase.from("tenants").select("phone").eq("id", tenantId).maybeSingle();
    const phone = (data as { phone?: string | null } | null)?.phone;
    if (!phone) return; // sin telefono del negocio no hay a quien alertar
    const creds = await new ZernioCredentialsRepository().leer();
    if (!creds.ok) return;
    const adapter = new ZernioAdapter(creds.value.webhookSecret, creds.value.apiKey);
    await adapter.sendTemplate({
      to: phone, templateName: PLANTILLA, language: "es", channel: "whatsapp",
      params: [contacto.slice(0, 120), resumen.slice(0, 300)],
    });
  } catch {
    /* fail-safe: la alerta al dueno nunca bloquea la respuesta al cliente */
  }
}
