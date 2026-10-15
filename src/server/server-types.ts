/**
 * HUB by Raisen — Tipos internos del servidor HTTP y brand helpers.
 */
import type {
  TenantId, ContactId, ConversationId, InboxId,
} from "../shared/domain/ids.ts";

export interface RequestContext {
  readonly method: string;
  readonly path: string;
  readonly headers: Record<string, string | string[] | undefined>;
  readonly body: unknown;
  readonly rawBody: string | null;
  readonly jwt: string | null;
}

export type RouteHandler = (ctx: RequestContext) => Promise<Record<string, unknown>>;

export interface RouteDefinition {
  readonly method: "GET" | "POST" | "PUT" | "DELETE" | "PATCH";
  readonly path: string;
  readonly handler: RouteHandler;
}

/** Marca un string como TenantId (solo type-level). */
export const tid = (s: string | null | undefined): TenantId => (s ?? "") as TenantId;
export const cid = (s: string | null | undefined): ContactId => (s ?? "") as ContactId;
export const coid = (s: string | null | undefined): ConversationId => (s ?? "") as ConversationId;
export const iid = (s: string | null | undefined): InboxId => (s ?? "") as InboxId;