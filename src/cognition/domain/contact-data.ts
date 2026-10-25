/**
 * HUB by Raisen — Parte B: datos base del cliente que el agente captura del hilo (nombre/telefono/email/
 * direccion/producto). Parse ROBUSTO del JSON del LLM + validacion (email, telefono, topes). Solo deja los
 * campos realmente presentes; descarta basura. Funcion PURA (testeable). C4 <=75. Sin any.
 */
export interface ExtractedData {
  readonly name?: string; readonly phone?: string; readonly email?: string;
  readonly address?: string; readonly product?: string;
}

const EMAIL = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

export function parseExtracted(raw: string): ExtractedData {
  let j: unknown;
  try { j = JSON.parse(extractJson(raw)); } catch { return {}; }
  if (typeof j !== "object" || j === null) return {};
  const o = j as Record<string, unknown>;
  const out: { name?: string; phone?: string; email?: string; address?: string; product?: string } = {};
  const name = str(o["name"]); if (name) out.name = name.slice(0, 120);
  const phone = str(o["phone"]); if (phone) { const p = phone.replace(/[^\d+]/g, ""); if (p.replace(/\D/g, "").length >= 7) out.phone = p.slice(0, 20); }
  const email = str(o["email"]); if (email && EMAIL.test(email)) out.email = email.slice(0, 160);
  const address = str(o["address"]); if (address && address.length >= 5) out.address = address.slice(0, 300);
  const product = str(o["product"]); if (product) out.product = product.slice(0, 160);
  return out;
}

function str(x: unknown): string { return typeof x === "string" ? x.trim() : ""; }
function extractJson(s: string): string { const a = s.indexOf("{"); const b = s.lastIndexOf("}"); return a >= 0 && b > a ? s.slice(a, b + 1) : s; }
