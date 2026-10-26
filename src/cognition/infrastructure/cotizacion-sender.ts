/**
 * HUB by Raisen — Envia la cotizacion al cliente por su MISMO canal (resumen + link /q/<token>) y marca la
 * fila como notificada. Resuelve los refs del proveedor desde la conversacion. Fail-safe (nunca rompe). C4 <=75.
 */
import type { ChannelRouter } from "../../channels/application/channel.router.ts";
import type { ChannelType } from "../../shared/domain/types.ts";
import type { ConversationId } from "../../shared/domain/ids.ts";
import { ConversationRepositorySupabase } from "../../inbox/infrastructure/conversation.repository.supabase.ts";
import { supabase } from "../../shared/infrastructure/supabase.client.ts";
import { getEnv } from "../../shared/infrastructure/supabase-rest.helper.ts";
import type { AutodraftEvent } from "../application/maybe-autodraft.service.ts";

function baseUrl(): string {
  const b = getEnv("PUBLIC_BASE_URL"); if (b) return b.replace(/\/+$/, "");
  const d = getEnv("RAILWAY_PUBLIC_DOMAIN"); return d ? `https://${d}` : "";
}

export function makeEnviarCotizacion(router: ChannelRouter): (ev: AutodraftEvent, resumen: string, token: string) => Promise<void> {
  const convs = new ConversationRepositorySupabase();
  return async (ev, resumen, token) => {
    try {
      let cid: string | undefined; let aid: string | undefined;
      if (ev.conversationId) {
        const c = await convs.buscar(ev.conversationId as ConversationId);
        if (c.ok && c.value) { cid = c.value.providerConversationId ?? undefined; aid = c.value.providerAccountId ?? undefined; }
      }
      const content = `${resumen}\n\nRevisa y acepta tu cotizacion aqui:\n${baseUrl()}/q/${token}`;
      const r = await router.enviar({ to: ev.from, content, channel: ev.channel as ChannelType, ...(cid ? { conversationId: cid } : {}), ...(aid ? { accountId: aid } : {}) });
      if (!r.ok) { console.error(`[quote-send] FALLO token=${token}`, r.error); return; }
      const { data } = await supabase.from("agent_drafts").select("id, metadata").eq("metadata->>token", token).maybeSingle();
      if (data) { const row = data as { id: string; metadata?: Record<string, unknown> }; await supabase.from("agent_drafts").update({ metadata: { ...(row.metadata ?? {}), clientNotifiedAt: new Date().toISOString() } }).eq("id", row.id); }
      console.error(`[quote-send] OK token=${token} to=${ev.from} ch=${ev.channel}`);
    } catch (e) { console.error(`[quote-send] ERROR`, e instanceof Error ? e.message : e); }
  };
}
