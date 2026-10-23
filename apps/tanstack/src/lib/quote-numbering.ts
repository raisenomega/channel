/**
 * HUB by Raisen — Numeracion de cotizacion: lee/define el prefijo+correlativo+pad (RPC current_tenant).
 * parseSeq "ZR00250" -> {prefix:"ZR", next:250, pad:5}. C4 <=75.
 */
import { supabaseRestBase, supabaseAuthHeaders } from "@/lib/supabase";

async function rpc<T>(fn: string, body: Record<string, unknown>): Promise<T | null> {
  const base = supabaseRestBase();
  const headers = supabaseAuthHeaders();
  if (!base || !headers) return null;
  try {
    const res = await fetch(`${base}/rpc/${fn}`, { method: "POST", headers: { ...headers, "content-type": "application/json" }, body: JSON.stringify(body) });
    return res.ok ? ((await res.json()) as T) : null;
  } catch { return null; }
}

export async function getQuoteNumbering(): Promise<{ prefix: string; next: number; pad: number } | null> {
  const rows = await rpc<Array<{ prefix: string | null; next: number | null; pad: number | null }>>("get_quote_numbering", {});
  const r = rows?.[0];
  if (!r || r.next == null) return null;
  return { prefix: r.prefix ?? "", next: r.next, pad: r.pad ?? 4 };
}

export async function setQuoteNumbering(prefix: string, next: number, pad: number): Promise<boolean> {
  return (await rpc<boolean>("set_quote_numbering", { p_prefix: prefix, p_next: next, p_pad: pad })) === true;
}

export function parseSeq(raw: string): { prefix: string; next: number; pad: number } {
  const m = raw.trim().match(/^([^\d]*)(\d+)$/);
  if (!m) return { prefix: raw.trim(), next: 1, pad: 4 };
  return { prefix: m[1] ?? "", next: Number(m[2]), pad: (m[2] ?? "").length };
}

export function formatSeq(prefix: string, next: number, pad: number): string {
  return `${prefix}${String(next).padStart(pad, "0")}`;
}
