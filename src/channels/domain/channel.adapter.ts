import { Result } from "../../shared/domain/result.ts";
import { ChannelType } from "../../shared/domain/types.ts";

export interface NormalizedMessage {
  readonly providerMessageId: string;
  readonly from: string;
  readonly channel: ChannelType;
  readonly content: string;
  readonly attachments: readonly string[];
}

export interface OutboundMessage {
  readonly to: string;
  readonly content: string;
  readonly channel: ChannelType;
}

export type AdapterError =
  | { readonly kind: "authentication_failed" }
  | { readonly kind: "rate_limited" }
  | { readonly kind: "provider_unavailable" }
  | { readonly kind: "invalid_payload" }
  | { readonly kind: "timeout" }
  | { readonly kind: "unknown"; readonly cause: string };

export interface ChannelAdapter {
  readonly provider: "zernio" | "meta_direct" | "resend" | "360dialog" | "twilio";
  readonly supportedChannels: readonly ChannelType[];

  sendMessage(msg: OutboundMessage): Promise<Result<void, AdapterError>>;
  sendTemplate(params: SendTemplateParams): Promise<Result<void, AdapterError>>;
  parseInboundWebhook(payload: unknown): Result<readonly NormalizedMessage[], ParseError>;
  verifyWebhook(signature: string, body: string): boolean;
  ping(): Promise<Result<boolean, AdapterError>>;
}

export interface SendTemplateParams {
  readonly to: string;
  readonly templateName: string;
  readonly language: string;
  readonly params: readonly string[];
  readonly channel: ChannelType;
}

export type ParseError = { readonly kind: "invalid_webhook_payload"; readonly cause: string };