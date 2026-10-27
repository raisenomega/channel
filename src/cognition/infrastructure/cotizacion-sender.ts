/**
 * HUB by Raisen — Envia la cotizacion al cliente por su MISMO canal: crea la cotizacion REAL (plantilla
 * oficial) + mintea el token + envia el link /q/<token> del FRONTEND. Devuelve la URL enviada (o null) para
 * cerrar el lazo: si salio el link, el chat NO genera respuesta redundante. Fail-safe. C4 <=75.
 */
import type { ChannelRouter } from "../../channels/application/channel.router.ts";
import type { ChannelType } from "../../shared/domain/types.ts";
import type { ConversationId } from "../../shared/domain/ids.ts";
import { ConversationRepositorySupabase } from "../../inbox/infrastructure/conversation.repository.supabase.ts";
import { supabase } from "../../shared/infrastructure/supabase.client.ts";
import { getEnv } from "../../shared/infrastructure/supabase-rest.helper.ts";
import type { AutodraftEvent } from "../application/maybe-autodraft.service.ts";
import { crearCotizacionOficial, type QuoteItem } from "./crear-cotizacion-oficial.ts";

function appUrl(): string { return (getEnv("PUBLIC_APP_URL") ?? "https://channel-one-snowy.vercel.app").replace(/\/+$/, ""); }

async function datosCliente(contactId: string): Promise<{ nombre: string; telefono: string; email: string; direccion: string }> {
  const { data } = await supabase.from("contacts").select("display_name, primary_phone, primary_email, address").eq("id", contactId).maybeSingle();
  const c = (data ?? {}) as { display_name?: string; primary_phone?: string; primary_email?: string; address?: string };
  return { nombre: c.display_name ?? "", telefono: c.primary_phone ?? "", email: c.primary_email ?? "", direccion: c.address ?? "" };
}

export type EnviarCotizacion = (ev: AutodraftEvent, items: readonly QuoteItem[], subtotal: number, total: number, service: string) => Promise<string | null>;

export function makeEnviarCotizacion(router: ChannelRouter): EnviarCotizacion {
  const convs = new ConversationRepositorySupabase();
  return async (ev, items, subtotal, total, service): Promise<string | null> => {
    try {
      if (!ev.contactId) return null;
      const cli = await datosCliente(String(ev.contactId));
      const token = await crearCotizacionOficial({ tenantId: ev.tenantId, contactId: String(ev.contactId), cliente: cli, items, subtotal, total, service });
      if (!token) { console.error("[quote-send] no se creo la cotizacion oficial"); return null; }
      const refs: { conversationId?: string; accountId?: string } = {};
      if (ev.conversationId) { const c = await convs.buscar(ev.conversationId as ConversationId); if (c.ok && c.value) { if (c.value.providerConversationId) refs.conversationId = c.value.providerConversationId; if (c.value.providerAccountId) refs.accountId = c.value.providerAccountId; } }
      const url = `${appUrl()}/q/${token}`;
      const content = `Tu cotizacion por $${total.toFixed(2)}. Revisa y acepta aqui:\n${url}`;
      const r = await router.enviar({ to: ev.from, content, channel: ev.channel as ChannelType, ...refs });
      if (!r.ok) { console.error("[quote-send] FALLO envio", r.error); return null; }
      console.error(`[quote-send] OK token=${token} to=${ev.from} ch=${ev.channel}`);
      return url;
    } catch (e) { console.error("[quote-send] ERROR", e instanceof Error ? e.message : e); return null; }
  };
}
