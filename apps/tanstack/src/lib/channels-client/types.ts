/**
 * HUB by Raisen — Tipos del cliente de canales.
 */
import type { ChannelKind } from "@/components/ui/channel-icon";

export interface Channel {
  readonly id: string;
  readonly kind: ChannelKind;
  readonly active: boolean;
  readonly state: "conectado" | "desconectado" | "autonomo";
  readonly provider: string | null;
  readonly syncStatus: string | null;
}

export type ChannelError =
  | { kind: "no_autorizado"; cause?: string }
  | { kind: "red"; cause?: string }
  | { kind: "config_incompleta"; cause?: string };

export type Result<T, E> =
  | { ok: true; value: T }
  | { ok: false; error: E };

export interface RowInbox {
  id: string;
  provider?: string | null;
  is_active?: boolean | null;
  sync_status?: string | null;
  channel_type?: string | null;
  name?: string | null;
}