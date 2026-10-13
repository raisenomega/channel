import { Result, err, ok } from "../../shared/domain/result.ts";
import { ChannelAdapter, OutboundMessage, SendTemplateParams, NormalizedMessage, AdapterError, ParseError } from "../../channels/domain/channel.adapter.ts";
import { ChannelType } from "../../shared/domain/types.ts";
import { supabase } from "../../shared/infrastructure/supabase.client.ts";

/**
 * Canal simulado para development (P1).
 * No depende de Zernio/Resend: escribe el mensaje directamente en la tabla
 * `messages` via Supabase (como si recibiera un mensaje de prueba local).
 */
export class DevChannelAdapter implements ChannelAdapter {
  readonly provider = "dev" as const;
  readonly supportedChannels: readonly ChannelType[] = ["webchat"];

  async sendMessage(msg: OutboundMessage): Promise<Result<void, AdapterError>> {
    const conversationId = Deno.env.get("DEV_CONVERSATION_ID");
    const contactId = Deno.env.get("DEV_CONTACT_ID");
    const tenantId = Deno.env.get("DEV_TENANT_ID");
    if (!conversationId || !contactId || !tenantId) {
      return err({ kind: "invalid_payload" });
    }
    try {
      const { error } = await supabase.from("messages").insert({
        conversation_id: conversationId,
        contact_id: contactId,
        tenant_id: tenantId,
        direction: "inbound",
        sender_type: "contact",
        channel: msg.channel,
        provider: this.provider,
        content: msg.content,
        content_type: "text",
        status: "received",
      });
      if (error) return err({ kind: "provider_unavailable" });
      return ok(undefined);
    } catch {
      return err({ kind: "timeout" });
    }
  }

  async sendTemplate(_params: SendTemplateParams): Promise<Result<void, AdapterError>> {
    return err({ kind: "invalid_payload" });
  }

  parseInboundWebhook(payload: unknown): Result<readonly NormalizedMessage[], ParseError> {
    if (typeof payload !== "object" || payload === null) {
      return err({ kind: "invalid_webhook_payload", cause: "cuerpo_invalido" });
    }
    try {
      const data = payload as Record<string, unknown>;
      const msg: NormalizedMessage = {
        providerMessageId: String(data.id ?? ""),
        from: String(data.from ?? ""),
        channel: "webchat",
        content: String(data.text ?? ""),
        attachments: [],
      };
      return ok(Object.freeze([msg]));
    } catch {
      return err({ kind: "invalid_webhook_payload", cause: "parseo_fallo" });
    }
  }

  verifyWebhook(signature: string, _body: string): boolean {
    return signature.length > 0;
  }

  async ping(): Promise<Result<boolean, AdapterError>> {
    return ok(true);
  }
}