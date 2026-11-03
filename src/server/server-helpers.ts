/**
 * HUB by Raisen — Helpers del servidor HTTP.
 */
import type * as http from "node:http";
import type { Result } from "../shared/domain/result.ts";
import type { ChannelType } from "../shared/domain/types.ts";
import type { ContentType } from "../inbox/domain/message.entity.ts";
import type { ChannelType as ComplianceChannelType } from "../compliance/domain/compliance.types.ts";

export function extractJwt(headers: Record<string, string | string[] | undefined>): string | null {
  const raw = headers["authorization"] ?? headers["Authorization"] ?? null;
  if (!raw) return null;
  const value = Array.isArray(raw) ? raw[0] : raw;
  if (!value) return null;
  const parts = value.split(" ");
  if (parts.length !== 2 || parts[0] !== "Bearer") return null;
  return parts[1] ?? null;
}

export function parseBody(raw: string): unknown {
  if (!raw) return null;
  try { return JSON.parse(raw) as unknown; } catch { return null; }
}

export function resultToJson<T, E>(result: Result<T, E>): Record<string, unknown> {
  if (result.ok) return { ok: true, data: result.value as Record<string, unknown> };
  return { ok: false, error: result.error as Record<string, unknown> };
}

const MAX_BODY_BYTES = 1_048_576; // 1 MB: evita OOM por body gigante / slow-loris

export function readBody(req: http.IncomingMessage): Promise<string> {
  return new Promise((resolvePromise, reject) => {
    const chunks: Buffer[] = [];
    let size = 0;
    const to = setTimeout(() => reject(new Error("body_timeout")), 15000);
    const done = (): void => { clearTimeout(to); };
    req.on("data", (chunk: Buffer) => {
      size += chunk.length;
      if (size > MAX_BODY_BYTES) { done(); reject(new Error("body_too_large")); return; }
      chunks.push(chunk);
    });
    req.on("end", () => { done(); resolvePromise(Buffer.concat(chunks).toString("utf-8")); });
    req.on("error", (e) => { done(); reject(e instanceof Error ? e : new Error("body_error")); });
    req.on("aborted", () => { done(); reject(new Error("body_aborted")); });
  });
}

export function obj(b: unknown): Record<string, unknown> {
  return (b as Record<string, unknown>) ?? {};
}

export function channelType(s: string | null | undefined): ChannelType {
  const valid: readonly ChannelType[] = [
    "whatsapp", "email", "instagram", "facebook",
    "telegram", "sms", "x", "linkedin", "webchat",
  ];
  const v = s ?? "webchat";
  return valid.includes(v as ChannelType) ? (v as ChannelType) : "webchat";
}

export function complianceChannel(s: string | null | undefined): ComplianceChannelType {
  const valid: readonly ComplianceChannelType[] = ["whatsapp", "email", "sms", "phone", "web"];
  const v = s ?? "web";
  return valid.includes(v as ComplianceChannelType) ? (v as ComplianceChannelType) : "web";
}

export function contentType(s: string | null | undefined): ContentType {
  const valid: readonly ContentType[] = [
    "text", "template", "image", "video", "audio",
    "document", "location", "contact_card", "sticker",
    "reaction", "system_event",
  ];
  const v = s ?? "text";
  return valid.includes(v as ContentType) ? (v as ContentType) : "text";
}