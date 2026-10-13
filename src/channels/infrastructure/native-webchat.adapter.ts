import { Result, err, ok } from "../../shared/domain/result.ts";
import { ChannelAdapter, OutboundMessage, SendTemplateParams, NormalizedMessage, AdapterError, ParseError } from "../../channels/domain/channel.adapter.ts";
import { ChannelType } from "../../shared/domain/types.ts";

export class NativeWebchatAdapter implements ChannelAdapter {
  readonly provider = "resend" as const;
  readonly supportedChannels: readonly ChannelType[] = ["webchat"];

  async sendMessage(msg: OutboundMessage): Promise<Result<void, AdapterError>> {
    try {
      const resp = await fetch("https://api.hub.webchat/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${this.apiKey}` },
        body: JSON.stringify({ to: msg.to, text: msg.content }),
      });
      if (!resp.ok) return err({ kind: "provider_unavailable" });
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
        channel: "webchat" as ChannelType,
        content: String(data.text ?? ""),
        attachments: (data.attachments as string[] ?? []),
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

  constructor(private readonly apiKey: string) {}
}