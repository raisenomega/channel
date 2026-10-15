/**
 * HUB by Raisen — CSRF token (HMAC-SHA256) para rutas públicas de cobro (Slide 3.3).
 * Formato: <timestamp>.<hmac(CSRF_SECRET, orderId + "." + timestamp)>.
 * Tolerancia de expiración: 15 min. C4 ≤60.
 */
import { Result, err, ok } from "../../shared/domain/result.ts";

export type CsrfError = "csrf_invalido" | "csrf_expirado";

const TOLERANCE_MS = 15 * 60 * 1000;

function getEnv(n: string): string {
  const d = (globalThis as Record<string, unknown>)["Deno"] as { env?: { get?(k: string): string | undefined } } | undefined;
  const v = d?.env?.get ? d.env.get(n) : process.env[n];
  return v ?? "";
}

async function hmac(key: string, msg: string): Promise<string> {
  const k = await crypto.subtle.importKey("raw", new TextEncoder().encode(key), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const sig = await crypto.subtle.sign("HMAC", k, new TextEncoder().encode(msg));
  return Array.from(new Uint8Array(sig)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

export const generarCsrf = async (orderId: string): Promise<Result<string, CsrfError>> => {
  const secret = getEnv("CSRF_SECRET");
  if (!secret) return err("csrf_invalido");
  const ts = String(Date.now());
  const mac = await hmac(secret, `${orderId}.${ts}`);
  return ok(`${ts}.${mac}`);
};

export const verificarCsrf = async (orderId: string, token: string): Promise<Result<void, CsrfError>> => {
  const secret = getEnv("CSRF_SECRET");
  if (!secret) return err("csrf_invalido");
  const dot = token.indexOf(".");
  if (dot < 0) return err("csrf_invalido");
  const ts = token.slice(0, dot);
  const mac = token.slice(dot + 1);
  if (!/^\d+$/.test(ts)) return err("csrf_invalido");
  const expected = await hmac(secret, `${orderId}.${ts}`);
  if (mac.length !== expected.length || !timingSafe(mac, expected)) return err("csrf_invalido");
  if (Date.now() - Number(ts) > TOLERANCE_MS) return err("csrf_expirado");
  return ok(undefined);
};

function timingSafe(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}