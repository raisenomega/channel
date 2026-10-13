import { Result, err, ok } from "../../shared/domain/result.ts";
import { InboxId, TenantId } from "../../shared/domain/ids.ts";
import { ChannelType } from "../../shared/domain/types.ts";

export type ProviderType =
  | "zernio" | "meta_direct" | "resend" | "360dialog" | "twilio";

export type SyncStatus =
  | "connected" | "disconnected" | "error" | "pending";

export interface InboxState {
  readonly id: InboxId;
  readonly tenantId: TenantId;
  readonly channelType: ChannelType;
  readonly provider: ProviderType;
  readonly name: string;
  readonly isActive: boolean;
  readonly isPrimaryForChannel: boolean;
  readonly syncStatus: SyncStatus;
  readonly createdAt: Date;
}

export type InboxCreateError =
  | { readonly kind: "nombre_vacio" }
  | { readonly kind: "provider_no_soportado" };

const providers: readonly ProviderType[] = [
  "zernio", "meta_direct", "resend", "360dialog", "twilio",
];

export const crearInbox = (
  name: string,
  channelType: ChannelType,
  provider: ProviderType,
  tenantId: TenantId,
): Result<InboxState, InboxCreateError> => {
  if (!name || name.trim().length === 0) {
    return err({ kind: "nombre_vacio" });
  }
  if (!providers.includes(provider)) {
    return err({ kind: "provider_no_soportado" });
  }
  const state: InboxState = Object.freeze({
    id: crypto.randomUUID() as InboxId,
    tenantId,
    channelType,
    provider,
    name: name.trim(),
    isActive: false,
    isPrimaryForChannel: false,
    syncStatus: "pending",
    createdAt: new Date(),
  });
  return ok(state);
};

export const activarInbox = (inbox: InboxState): InboxState =>
  Object.freeze({ ...inbox, isActive: true, syncStatus: "connected" as SyncStatus });

export const desactivarInbox = (inbox: InboxState): InboxState =>
  Object.freeze({ ...inbox, isActive: false, syncStatus: "disconnected" as SyncStatus });