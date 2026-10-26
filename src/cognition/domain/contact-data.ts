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
  const email = str(o["email"]).replace(/\s+/g, ""); if (email && EMAIL.test(email)) out.email = email.slice(0, 160);
  const address = str(o["address"]); if (address && address.length >= 5) out.address = address.slice(0, 300);
  const product = str(o["product"]); if (product) out.product = product.slice(0, 160);
  return out;
}

function str(x: unknown): string { return typeof x === "string" ? fixMojibake(x.trim()) : ""; }

// Safety-net DETERMINISTICO (no depende del LLM): rescata email/telefono del texto del hilo. Junta espacios
// alrededor de @ y " . " -> "Johanny . 121894@gmail.com" => "Johanny.121894@gmail.com". Valida igual.
export function detectarEmailPhone(texto: string): { email?: string; phone?: string } {
  const j = texto.replace(/\s*@\s*/g, "@").replace(/\s+\.\s+/g, ".");
  const em = j.match(/[\w.+-]+@[\w.-]+\.\w{2,}/);
  const ph = texto.match(/\+?\d[\d\s().-]{6,}\d/);
  const out: { email?: string; phone?: string } = {};
  if (em && EMAIL.test(em[0])) out.email = em[0].slice(0, 160);
  if (ph) { const p = ph[0].replace(/[^\d+]/g, ""); if (p.replace(/\D/g, "").length >= 7) out.phone = p.slice(0, 20); }
  return out;
}

export function fixMojibake(s: string): string {
  // Repara doble-codificacion UTF-8 (ej. "orquÃ­dea" -> "orquídea"). Solo si hay patron y todo es Latin-1.
  if (!/[ÃÂ][-¿­]/.test(s)) return s;
  if ([...s].some((ch) => ch.charCodeAt(0) > 0xff)) return s; // mezcla con unicode real: no tocar
  try { return new TextDecoder("utf-8", { fatal: true }).decode(Uint8Array.from([...s], (ch) => ch.charCodeAt(0))); }
  catch { return s; } // si no es UTF-8 valido, dejalo igual
}
function extractJson(s: string): string { const a = s.indexOf("{"); const b = s.lastIndexOf("}"); return a >= 0 && b > a ? s.slice(a, b + 1) : s; }
