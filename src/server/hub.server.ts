/**
 * HUB by Raisen — HTTP Server minimo (Node.js native: node:http).
 *
 * Arranca el runtime que conecta los handlers de application con
 * repositorios reales de infrastructure (Supabase).
 *
 * USO:
 *   node --experimental-strip-types src/server/hub.server.ts
 *   bash scripts/start-server.sh
 */

// Polyfill minimo de Deno.env para Node.js
import * as nodeProcess from "node:process";
if (typeof (globalThis as Record<string, unknown>).Deno === "undefined") {
  (globalThis as Record<string, unknown>).Deno = {
    env: {
      get(name: string): string | undefined {
        return nodeProcess.env[name] ?? undefined;
      },
    },
    exit(code?: number): never {
      nodeProcess.exit(code ?? 0);
    },
  };
}

import * as http from "node:http";

// Handlers de application
import { ProcessWebhookHandler } from "../channels/application/process-webhook.handler.ts";
import { ChannelRouter } from "../channels/application/channel.router.ts";
import { DevChannelAdapter } from "../channels/infrastructure/dev-channel.adapter.ts";
import { ReceiveMessageHandler } from "../inbox/application/receive-message.handler.ts";
import { SendMessageHandler } from "../inbox/application/send-message.handler.ts";
import { CreateQuoteHandler } from "../commerce/application/create-quote.handler.ts";
import { OptInHandler } from "../compliance/application/opt-in.handler.ts";
import { ListInboxHandler } from "../inbox/application/list-inbox.query.ts";

// Repositorios Supabase de infrastructure
import { ConversationRepositorySupabase } from "../inbox/infrastructure/conversation.repository.supabase.ts";
import { MessageRepositorySupabase } from "../inbox/infrastructure/message.repository.supabase.ts";
import { ConsentRepositorySupabase } from "../compliance/infrastructure/consent.repository.supabase.ts";

// Tipos compartidos
import type { Result } from "../shared/domain/result.ts";
import type { QuoteRepository } from "../commerce/domain/commerce.repository.ts";
import type {
  TenantId, ContactId, ConversationId,
  InboxId, QuoteId, AgentId,
} from "../shared/domain/ids.ts";
import type { ChannelType, ConversationStatus } from "../shared/domain/types.ts";
import type { MessageContent, AiMode, ContentType } from "../inbox/domain/message.entity.ts";
import type { QuoteLineItem, CreateByType } from "../commerce/domain/quote.entity.ts";
import type { ConsentSource } from "../compliance/domain/compliance.entity.ts";
// Compliance usa su propio ChannelType — mapeamos desde el generico.
import type { ChannelType as ComplianceChannelType } from "../compliance/domain/compliance.types.ts";

// ---- Brand helpers (coercion segura desde string plano) ----

/** Marca un string como TenantId (solo type-level). */
const tid = (s: string | null | undefined): TenantId => (s ?? "") as TenantId;
const cid = (s: string | null | undefined): ContactId => (s ?? "") as ContactId;
const coid = (s: string | null | undefined): ConversationId => (s ?? "") as ConversationId;
const iid = (s: string | null | undefined): InboxId => (s ?? "") as InboxId;
const qid = (s: string | null | undefined): QuoteId => (s ?? "") as QuoteId;
const aid = (s: string | null | undefined): AgentId => (s ?? "") as AgentId;

// ---- Tipos internos del server ----

interface RequestContext {
  readonly method: string;
  readonly path: string;
  readonly headers: Record<string, string | string[] | undefined>;
  readonly body: unknown;
  readonly jwt: string | null;
}

type RouteHandler = (ctx: RequestContext) => Promise<Record<string, unknown>>;

interface RouteDefinition {
  readonly method: "GET" | "POST" | "PUT" | "DELETE" | "PATCH";
  readonly path: string;
  readonly handler: RouteHandler;
}

// ---- Helpers ----

function extractJwt(headers: Record<string, string | string[] | undefined>): string | null {
  const raw = headers["authorization"] ?? headers["Authorization"] ?? null;
  if (!raw) return null;
  const value = Array.isArray(raw) ? raw[0] : raw;
  if (!value) return null;
  const parts = value.split(" ");
  if (parts.length !== 2 || parts[0] !== "Bearer") return null;
  return parts[1] ?? null;
}

function parseBody(raw: string): unknown {
  if (!raw) return null;
  try { return JSON.parse(raw) as unknown; } catch { return null; }
}

function resultToJson<T, E>(result: Result<T, E>): Record<string, unknown> {
  if (result.ok) return { ok: true, data: result.value as Record<string, unknown> };
  return { ok: false, error: result.error as Record<string, unknown> };
}

function readBody(req: http.IncomingMessage): Promise<string> {
  return new Promise((resolvePromise) => {
    const chunks: Buffer[] = [];
    req.on("data", (chunk: Buffer) => chunks.push(chunk));
    req.on("end", () => resolvePromise(Buffer.concat(chunks).toString("utf-8")));
  });
}

// ---- Construccion de dependencias reales ----

/** QuoteRepository minimo (no hay implementacion Supabase en infrastructure). */
const quoteRepo: QuoteRepository = {
  async guardar() {
    return { ok: true as const, value: undefined };
  },
  async buscar() {
    return { ok: true as const, value: null };
  },
};

function buildHandlers() {
  const convRepo = new ConversationRepositorySupabase();
  const msgRepo = new MessageRepositorySupabase();
  const consentRepo = new ConsentRepositorySupabase();
  const channelRouter = new ChannelRouter();
  channelRouter.registrar(new DevChannelAdapter());

  return {
    processWebhook: new ProcessWebhookHandler(channelRouter),
    receiveMessage: new ReceiveMessageHandler(convRepo),
    sendMessage: new SendMessageHandler(convRepo, msgRepo),
    createQuote: new CreateQuoteHandler(quoteRepo),
    optIn: new OptInHandler(consentRepo),
    listInbox: new ListInboxHandler(convRepo),
  };
}

function obj(b: unknown): Record<string, unknown> {
  return (b as Record<string, unknown>) ?? {};
}

function channelType(s: string | null | undefined): ChannelType {
  const valid: readonly ChannelType[] = [
    "whatsapp", "email", "instagram", "facebook",
    "telegram", "sms", "x", "linkedin", "webchat",
  ];
  const v = s ?? "webchat";
  return valid.includes(v as ChannelType) ? (v as ChannelType) : "webchat";
}

function complianceChannel(s: string | null | undefined): ComplianceChannelType {
  const valid: readonly ComplianceChannelType[] = [
    "whatsapp", "email", "sms", "phone", "web",
  ];
  const v = s ?? "web";
  return valid.includes(v as ComplianceChannelType) ? (v as ComplianceChannelType) : "web";
}

function contentType(s: string | null | undefined): ContentType {
  const valid: readonly ContentType[] = [
    "text", "template", "image", "video", "audio",
    "document", "location", "contact_card", "sticker",
    "reaction", "system_event",
  ];
  const v = s ?? "text";
  return valid.includes(v as ContentType) ? (v as ContentType) : "text";
}

// ---- Rutas registradas ----

function registrarRutas(h: ReturnType<typeof buildHandlers>): RouteDefinition[] {
  return [
    // POST /api/webhook
    {
      method: "POST",
      path: "/api/webhook",
      handler: async (ctx) => {
        const b = obj(ctx.body);
        return resultToJson(
          h.processWebhook.ejecutar({
            provider: (b["provider"] as string) ?? "",
            signature: (b["signature"] as string) ?? "",
            body: (b["body"] as string) ?? "",
            rawPayload: b["rawPayload"],
          }),
        );
      },
    },

    // POST /api/message/receive
    {
      method: "POST",
      path: "/api/message/receive",
      handler: async (ctx) => {
        const b = obj(ctx.body);
        const rawContent = b["content"] as Record<string, unknown> | undefined;
        const content: MessageContent = {
          type: contentType(rawContent?.["type"] as string),
          body: (rawContent?.["body"] as string) ?? "",
        };
        return resultToJson(
          await h.receiveMessage.ejecutar({
            tenantId: tid(b["tenantId"] as string),
            inboxId: iid(b["inboxId"] as string),
            channel: channelType(b["channel"] as string),
            provider: (b["provider"] as string) ?? "",
            from: (b["from"] as string) ?? "",
            contactId: cid(b["contactId"] as string),
            content,
          }),
        );
      },
    },

    // POST /api/message/send
    {
      method: "POST",
      path: "/api/message/send",
      handler: async (ctx) => {
        const b = obj(ctx.body);
        const rawContent = b["content"] as Record<string, unknown> | undefined;
        const content: MessageContent = {
          type: contentType(rawContent?.["type"] as string),
          body: (rawContent?.["body"] as string) ?? "",
        };
        return resultToJson(
          await h.sendMessage.ejecutar({
            tenantId: tid(b["tenantId"] as string),
            conversationId: coid(b["conversationId"] as string),
            contactId: cid(b["contactId"] as string),
            channel: channelType(b["channel"] as string),
            provider: (b["provider"] as string) ?? "",
            content,
            senderType: (b["senderType"] as "human_agent" | "ai_agent" | "system") ?? "system",
          } as Parameters<typeof h.sendMessage.ejecutar>[0]),
        );
      },
    },

    // POST /api/quote/create
    {
      method: "POST",
      path: "/api/quote/create",
      handler: async (ctx) => {
        const b = obj(ctx.body);
        const rawItems = (b["items"] as Array<Record<string, unknown>>) ?? [];
        const items: readonly QuoteLineItem[] = rawItems.map((item) => ({
          description: (item["description"] as string) ?? "",
          quantity: (item["quantity"] as number) ?? 1,
          unitPrice: (item["unitPrice"] as number) ?? 0,
          total: (item["total"] as number) ?? 0,
        }));
        return resultToJson(
          await h.createQuote.ejecutar({
            tenantId: tid(b["tenantId"] as string),
            contactId: cid(b["contactId"] as string),
            items,
            createdByType: (b["createdByType"] as CreateByType) ?? "human",
            mode: (b["mode"] as "lite" | "nucleo_synced") ?? "lite",
          } as Parameters<typeof h.createQuote.ejecutar>[0]),
        );
      },
    },

    // POST /api/compliance/opt-in
    {
      method: "POST",
      path: "/api/compliance/opt-in",
      handler: async (ctx) => {
        const b = obj(ctx.body);
        return resultToJson(
          await h.optIn.ejecutar(
            cid(b["contactId"] as string),
            tid(b["tenantId"] as string),
            complianceChannel(b["channel"] as string),
            (b["source"] as ConsentSource) ?? "explicit",
          ),
        );
      },
    },

    // GET /api/inbox/list
    {
      method: "GET",
      path: "/api/inbox/list",
      handler: async (ctx) => {
        const url = new URL(ctx.path, "http://localhost");
        const status = url.searchParams.get("status") ?? "all";
        const limitStr = url.searchParams.get("limit") ?? "50";
        const limit = parseInt(limitStr, 10) || 50;
        return resultToJson(
          await h.listInbox.ejecutar({
            tenantId: tid(url.searchParams.get("tenantId")),
            status: status as "all" | "open" | "pending" | "snoozed" | "resolved" | "archived",
            assignedAgentId: null,
            limit,
          }),
        );
      },
    },
  ];
}

// ---- Matcher de rutas ----

function matchRoute(
  routes: RouteDefinition[],
  method: string,
  pathname: string,
): RouteDefinition | null {
  const clean = pathname.replace(/\/+$/, "") || "/";
  for (const r of routes) {
    if (r.method !== method) continue;
    const rClean = r.path.replace(/\/+$/, "") || "/";
    if (rClean === clean || rClean === pathname) return r;
  }
  return null;
}

// ---- Server HTTP ----

const PORT = parseInt(nodeProcess.env["PORT"] ?? "8080", 10);
const HOST = nodeProcess.env["HOST"] ?? "0.0.0.0";

const handlers = buildHandlers();
const routes = registrarRutas(handlers);

const server = http.createServer(async (req, res) => {
  // CORS headers
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") {
    res.writeHead(204);
    res.end();
    return;
  }

  const rawBody = await readBody(req);
  const parsedBody = parseBody(rawBody);
  const thePath = req.url ?? "/";
  const theMethod = req.method ?? "GET";

  const ctx: RequestContext = {
    method: theMethod,
    path: thePath,
    headers: req.headers as Record<string, string | string[] | undefined>,
    body: parsedBody,
    jwt: extractJwt(req.headers as Record<string, string | string[] | undefined>),
  };

  const route = matchRoute(routes, theMethod, thePath);
  if (!route) {
    res.writeHead(404, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ ok: false, error: { kind: "ruta_no_encontrada", path: thePath } }));
    return;
  }

  try {
    const result = await route.handler(ctx);
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify(result));
  } catch (err) {
    console.error("[HUB] Error en handler:", err);
    res.writeHead(500, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ ok: false, error: { kind: "internal_error", message: String(err) } }));
  }
});

server.listen(PORT, HOST, () => {
  console.log(`[HUB] Server escuchando en http://${HOST}:${PORT}`);
  console.log(`[HUB] Rutas registradas:`);
  for (const r of routes) {
    console.log(`       ${r.method} ${r.path}`);
  }
});