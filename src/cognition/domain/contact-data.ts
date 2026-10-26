/**
 * HUB by Raisen — Parte B: datos base del cliente que el agente captura del hilo (nombre/telefono/email/
 * direccion/producto). Parse ROBUSTO del JSON del LLM + validacion (email, telefono, topes). Solo deja los
 * campos realmente presentes; descarta basura. Funcion PURA (testeable). C4 <=75. Sin any.
 */
export interface ExtractedData {
  readonly name?: string; readonly phone?: string; readonly email?: string;
  readonly address?: string; readonly product?: string;
}
export interface DatosDuros { email?: string; phone?: string; address?: string; name?: string; }

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

// Safety-net DETERMINISTICO (no depende del LLM): rescata los 4 datos del texto que dio el CLIENTE, este donde
// este en el hilo. Junta espacios alrededor de @ y " . " ("Johanny . 12@gmail.com" => "Johanny.12@gmail.com").
export function detectarDatos(texto: string): DatosDuros {
  const j = texto.replace(/\s*@\s*/g, "@").replace(/\s+\.\s+/g, ".");
  const em = j.match(/[\w.+-]+@[\w.-]+\.\w{2,}/);
  const ph = texto.match(/\+?\d[\d\s().-]{6,}\d/);
  const out: DatosDuros = {};
  if (em && EMAIL.test(em[0])) out.email = em[0].slice(0, 160);
  if (ph) { const p = ph[0].replace(/[^\d+]/g, ""); if (p.replace(/\D/g, "").length >= 7) out.phone = p.slice(0, 20); }
  const dir = detDireccion(texto); if (dir) out.address = dir;
  const nom = detNombre(texto); if (nom) out.name = nom;
  return out;
}

function detDireccion(texto: string): string | undefined { // desde el marcador de via hasta el proximo campo
  const m = texto.match(/\b(calle|ave\.?|avenida|carr\.?|carretera|urb\.?|urbanizaci[oó]n|centro comercial|plaza|sector|barrio|bo\.?|bda\.?|cond\.?|condominio|km)\b/i);
  if (!m || m.index === undefined) return undefined;
  let seg = texto.slice(m.index, m.index + 110);
  const cut = seg.search(/\n|\s+mi\s+|[\w.+-]+@|\btel[eé]fono\b|\bcorreo\b|\bemail\b|\bnumero\b/i);
  if (cut >= 6) seg = seg.slice(0, cut);
  seg = seg.trim();
  return seg.length >= 6 ? seg.slice(0, 300) : undefined;
}

function detNombre(texto: string): string | undefined { // "me llamo X / mi nombre es X / nombre: X"
  const m = texto.match(/\b(?:me llamo|mi nombre es|nombre:?)\s+([A-Za-zÁÉÍÓÚáéíóúÑñ'’.-]+(?:\s+[A-Za-zÁÉÍÓÚáéíóúÑñ'’.-]+){0,2})/i);
  if (!m) return undefined;
  const n = (m[1] ?? "").replace(/\s+(mi|de|y|en|el|la|es|soy|para|del)\b[\s\S]*$/i, "").trim();
  return n.length >= 2 ? n.slice(0, 120) : undefined;
}

export function fixMojibake(s: string): string {
  // Repara doble-codificacion UTF-8 (ej. "orquÃ­dea" -> "orquídea"). Solo si hay patron y todo es Latin-1.
  if (!/[ÃÂ][-¿­]/.test(s)) return s;
  if ([...s].some((ch) => ch.charCodeAt(0) > 0xff)) return s; // mezcla con unicode real: no tocar
  try { return new TextDecoder("utf-8", { fatal: true }).decode(Uint8Array.from([...s], (ch) => ch.charCodeAt(0))); }
  catch { return s; } // si no es UTF-8 valido, dejalo igual
}
function extractJson(s: string): string { const a = s.indexOf("{"); const b = s.lastIndexOf("}"); return a >= 0 && b > a ? s.slice(a, b + 1) : s; }
