/**
 * HUB by Raisen — Canal: modelo de datos de canales (FASE 9.5-9.7).
 * Registro de los 9 canales, proveedores IA y estados honestos de persistencia.
 */

export type ChannelKey =
  | "whatsapp" | "email" | "instagram" | "facebook" | "telegram"
  | "sms" | "x" | "linkedin" | "webchat";

export type ProviderKey = "anthropic" | "deepseek" | "qwen";

/** Estado honesto de persistencia (N5): refleja lo que realmente ocurrio. */
export type SyncMark = "cloud" | "local" | "error" | "pending";

export interface CanalState {
  readonly key: ChannelKey;
  active: boolean;
  autonomous: boolean;
  sync: SyncMark;
}

export interface ProveedorState {
  provider: ProviderKey;
  keyConfigured: boolean;
  sync: SyncMark;
}

export const CANALES: readonly { readonly key: ChannelKey; readonly icon: string }[] = Object.freeze([
  { key: "whatsapp", icon: "phone" },
  { key: "email", icon: "mail" },
  { key: "instagram", icon: "contacts" },
  { key: "facebook", icon: "channels" },
  { key: "telegram", icon: "send" },
  { key: "sms", icon: "message-square" },
  { key: "x", icon: "message-square" },
  { key: "linkedin", icon: "contacts" },
  { key: "webchat", icon: "chat" },
]);

export const PROVEEDORES: readonly { readonly key: ProviderKey; readonly model: string }[] = Object.freeze([
  { key: "anthropic", model: "claude-sonnet-4-6" },
  { key: "deepseek", model: "deepseek-chat" },
  { key: "qwen", model: "qwen-plus" },
]);

/** Mapea canal -> provider valido del check de inboxes (004_channels.sql). */
export const PROVIDER_CANAL: Readonly<Record<ChannelKey, string>> = Object.freeze({
  whatsapp: "zernio",
  email: "resend",
  instagram: "meta_direct",
  facebook: "meta_direct",
  telegram: "zernio",
  sms: "twilio",
  x: "zernio",
  linkedin: "zernio",
  webchat: "zernio",
});

export function canalDe(id: string): ChannelKey {
  const c = CANALES.find((n) => n.key === id);
  return c ? c.key : "webchat";
}

export function modeloDe(provider: ProviderKey): string {
  return PROVEEDORES.find((p) => p.key === provider)?.model ?? "claude-sonnet-4-6";
}