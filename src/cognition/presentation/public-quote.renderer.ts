/**
 * HUB by Raisen — HTML de la cotizacion PUBLICA (cliente abre el link). Sin JS; escape total anti-XSS;
 * aceptar/rechazar via forms POST. Si ya hay decision, muestra el estado. C4 <=75.
 */
import type { PublicQuote } from "../infrastructure/public-quote.query.ts";

function esc(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c] as string));
}

const STYLE = "body{font-family:system-ui,Arial,sans-serif;max-width:560px;margin:0 auto;padding:20px;color:#111;background:#fafafa}h1{font-size:20px}table{width:100%;border-collapse:collapse;margin:16px 0}td,th{text-align:left;padding:8px;border-bottom:1px solid #ddd;font-size:14px}.tot{font-size:18px;font-weight:700;text-align:right;margin:12px 0}button{width:100%;padding:14px;font-size:16px;font-weight:700;border:0;border-radius:10px;margin:6px 0;color:#fff}.a{background:#16a34a}.r{background:#dc2626}.d{padding:16px;border-radius:10px;background:#eef;font-weight:600;text-align:center}";

export function renderQuotePage(token: string, q: PublicQuote): string {
  const rows = q.items.map((l) => `<tr><td>${esc(l.description)}</td><td>${l.quantity}</td><td>$${l.unitPrice.toFixed(2)}</td><td>$${l.lineTotal.toFixed(2)}</td></tr>`).join("");
  const t = esc(token);
  const acciones = q.decision
    ? `<p class="d">${q.decision === "accepted" ? "Aceptaste esta cotizacion. Gracias, nuestro equipo coordinara contigo." : "Rechazaste esta cotizacion."}</p>`
    : `<form method="POST" action="/q/${t}/accept"><button class="a">Aceptar cotizacion</button></form><form method="POST" action="/q/${t}/reject"><button class="r">Rechazar</button></form>`;
  return `<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(q.business)}</title><style>${STYLE}</style></head><body><h1>${esc(q.business)}</h1>${q.conclusion ? `<p>${esc(q.conclusion)}</p>` : ""}<table><thead><tr><th>Detalle</th><th>Cant.</th><th>Precio</th><th>Total</th></tr></thead><tbody>${rows}</tbody></table><p class="tot">Total: $${q.total.toFixed(2)}</p>${acciones}</body></html>`;
}

export function pageSimple(msg: string): string {
  return `<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Cotizacion</title><style>${STYLE}</style></head><body><p class="d">${esc(msg)}</p></body></html>`;
}
