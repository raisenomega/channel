import type { Channel } from "@/lib/channels-client";
import type { ChannelKind } from "@/components/ui/channel-icon";

export const CATALOGO: readonly ChannelKind[] = [
  "whatsapp", "email", "instagram", "facebook", "telegram",
  "sms", "x", "linkedin", "webchat",
];

export const TONE: Readonly<Record<Channel["state"], "success" | "warn" | "process">> = {
  conectado: "success",
  desconectado: "warn",
  autonomo: "process",
};

export type { ChannelKind };