import { Result, err, ok } from "../../shared/domain/result.ts";
import { ChannelAdapter, OutboundMessage, SendTemplateParams, NormalizedMessage, AdapterError } from "../../channels/domain/channel.adapter.ts";
import { ChannelType } from "../../shared/domain/types.ts";

export class ZernioAdapter implements ChannelAdapter {
  readonly provider = "zernio" as const;
  readonly supportedChannels: readonly ChannelType[] = [
    "whatsapp", "instagram", "facebook", "telegram", "sms", "x", "linkedin",
  ];

  async sendMessage(msg: OutboundMessage): Promise<Result<void, AdapterError>> {
    try {
      const resp = await fetch("https://api.zernio.io/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${this.apiKey}` },
        body: JSON.stringify({ channel: msg.channel, to: msg.to, text: msg.content }),
      });
      if (!resp.ok) return err({ kind: "provider_unavailable" });
      return ok(undefined);
    } catch {
      return err({ kind: "timeout" });
    }
  }

  async sendTemplate(params: SendTemplateParams): Promise<Result<void, AdapterError>> {
    try {
      const resp = await fetch("https://api.zernio.io/v1/templates", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${this.apiKey}` },
        body: JSON.stringify(params),
      });
      if (!resp.ok) return err({ kind: "provider_unavailable" });
      return ok(undefined);
    } catch {
      return err({ kind: "timeout" });
    }
  }

  parseInboundWebhook(payload: unknown): Result<readonly NormalizedMessage[], AdapterError> {
    if (typeof payload !== "object" || payload === null) {
      return err({ kind: "invalid_payload" });
    }
    try {
      const data = payload as Record<string, unknown>;
      const messages: NormalizedMessage[] = (data.messages as Record<string, unknown>[] ?? []).map((m) => ({
        providerMessageId: String(m.id ?? ""),
        from: String(m.from ?? ""),
        channel: String(m.channel ?? "") as ChannelType,
        content: String(m.text ?? ""),
        attachments: (m.attachments as string[] ?? []),
      }));
      return ok(Object.freeze(messages));
    } catch {
      return err({ kind: "invalid_payload" });
    }
  }

  verifyWebhook(signature: string, body: string): boolean {
    return signature.length > 0 && body.length > 0;
  }

  async ping(): Promise<Result<boolean, AdapterError>> {
    try {
      const resp = await fetch("https://api.zernio.io/v1/health");
      return ok(resp.ok);
    } catch {
      return err({ kind: "provider_unavailable" });
    }
  }

  constructor(private readonly apiKey: string) {}
}