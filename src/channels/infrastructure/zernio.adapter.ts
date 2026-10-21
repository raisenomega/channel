/**
 * HUB by Raisen — Adapter Zernio endurecido (Slide 4.2a).
 * HMAC real + retry + dead-letter. Reemplaza el stub verifyWebhook. C4 ≤75.
 */
import { Result, err, ok } from "../../shared/domain/result.ts";
import { ChannelAdapter, OutboundMessage, SendTemplateParams, NormalizedMessage, AdapterError, ParseError } from "../../channels/domain/channel.adapter.ts";
import { ChannelType } from "../../shared/domain/types.ts";
import { verifyZernioHmac } from "./zernio.hmac.ts";
import { conReintentos, RetryConfig } from "./zernio.retry.ts";
import { supabaseBase, supabaseHdrs } from "../../shared/infrastructure/supabase-rest.helper.ts";

const RETRY_CFG: RetryConfig = Object.freeze({ maxIntentos: 3, backoffBaseMs: 1000 });

async function deadLetter(provider: string, payload: unknown, kind: string, detail: string, retries: number): Promise<void> {
  const u = supabaseBase(); const h = supabaseHdrs();
  if (!u || !h) return;
  try { await fetch(`${u}/webhook_failures`, { method: "POST", headers: h, body: JSON.stringify({ provider, payload, error_kind: kind, error_detail: detail, retries }) }); } catch { /* absorb */ }
}

export class ZernioAdapter implements ChannelAdapter {
  readonly provider = "zernio" as const;
  readonly supportedChannels: readonly ChannelType[] = Object.freeze(["whatsapp", "instagram", "facebook", "telegram", "sms", "x", "linkedin"]);

  async sendMessage(msg: OutboundMessage): Promise<Result<void, AdapterError>> {
    const { conversationId, accountId } = msg; // #1: Zernio exige ambos (ruta + body); consts locales para el closure
    if (!conversationId || !accountId) return err({ kind: "invalid_payload" });
    const r = await conReintentos(() => this.post(`/v1/inbox/conversations/${encodeURIComponent(conversationId)}/messages`, { accountId, message: msg.content }), RETRY_CFG);
    if (!r.ok) { deadLetter("zernio", msg, "retry_agotado", r.error.ultimo_error, r.error.intentos); return err({ kind: "retry_agotado", intentos: r.error.intentos, ultimo_error: r.error.ultimo_error }); }
    const b = r.value as { success?: boolean; data?: { partialFailure?: unknown } } | null; // 200 con success:false/partialFailure = NO entregado
    if (b && (b.success === false || b.data?.partialFailure)) { deadLetter("zernio", msg, "no_entregado", JSON.stringify(b), RETRY_CFG.maxIntentos); return err({ kind: "provider_unavailable" }); }
    return ok(undefined);
  }

  async sendTemplate(params: SendTemplateParams): Promise<Result<void, AdapterError>> {
    const r = await conReintentos(() => this.post("/v1/whatsapp/templates", { ...params }), RETRY_CFG);
    if (!r.ok) return err({ kind: "retry_agotado", intentos: r.error.intentos, ultimo_error: r.error.ultimo_error });
    return ok(undefined);
  }

  async ping(): Promise<Result<boolean, AdapterError>> {
    const ret = await conReintentos(async () => {
      const res = await fetch("https://api.zernio.io/v1/health");
      return res.ok ? ok(true) : err({ causa: `http_${res.status}` });
    }, RETRY_CFG);
    return ret.ok ? ok(true) : err({ kind: "retry_agotado", intentos: ret.error.intentos, ultimo_error: ret.error.ultimo_error });
  }

  parseInboundWebhook(payload: unknown): Result<readonly NormalizedMessage[], ParseError> {
    if (typeof payload !== "object" || payload === null) return err({ kind: "invalid_webhook_payload", cause: "cuerpo_invalido" });
    try {
      const data = payload as Record<string, unknown>;
      const messages: NormalizedMessage[] = (data.messages as Record<string, unknown>[] ?? []).map((m) => ({
        providerMessageId: String(m.id ?? ""), from: String(m.from ?? ""),
        channel: String(m.channel ?? "") as ChannelType, content: String(m.text ?? ""),
        attachments: (m.attachments as string[] ?? []),
      }));
      return ok(Object.freeze(messages));
    } catch { return err({ kind: "invalid_webhook_payload", cause: "parseo_fallo" }); }
  }

  async verifyWebhook(signature: string, body: string): Promise<boolean> {
    const r = await verifyZernioHmac(body, signature, this.webhookSecret);
    return r.ok;
  }

  constructor(private readonly webhookSecret: string, private readonly apiKey: string) {}

  private async post(path: string, body: Record<string, unknown>): Promise<Result<unknown, { readonly causa: string }>> {
    try {
      const r = await fetch(`https://api.zernio.io${path}`, { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${this.apiKey}` }, body: JSON.stringify(body) });
      if (!r.ok) return err({ causa: `http_${r.status}` });
      return ok(await r.json().catch(() => ({})));
    } catch (e) { return err({ causa: String(e) }); }
  }
}