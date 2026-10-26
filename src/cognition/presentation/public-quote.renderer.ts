/**
 * HUB by Raisen — DOCUMENTO formal (estilo-PDF, HTML) de la cotizacion publica: encabezado del negocio,
 * numero/fecha, cliente, items, total, terminos. Botones Aceptar/Rechazar ABAJO (fuera del documento).
 * Abre al instante en todo dispositivo; sin JS; escape total anti-XSS. C4 <=75.
 */
import type { DatosCotizacion } from "../infrastructure/public-quote.biz.ts";

function esc(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c] as string));
}

const STYLE = "*{box-sizing:border-box}body{font-family:system-ui,Arial,sans-serif;margin:0;padding:16px;background:#eef1f5;color:#1a1a1a}.doc{max-width:640px;margin:0 auto;background:#fff;border-radius:12px;box-shadow:0 2px 14px rgba(0,0,0,.08);padding:28px}.head{display:flex;justify-content:space-between;align-items:flex-start;border-bottom:2px solid #111;padding-bottom:14px;margin-bottom:16px;gap:12px}.logo{max-height:52px;margin-bottom:6px;display:block}.biz{font-size:20px;font-weight:800}.sub{font-size:12px;color:#555;line-height:1.5}.right{text-align:right}.title{font-size:22px;font-weight:800;letter-spacing:1px}.para{margin:10px 0;font-size:14px}.desc{font-size:13px;color:#444;background:#f7f8fa;padding:10px;border-radius:8px}table{width:100%;border-collapse:collapse;margin:16px 0}th,td{padding:9px 8px;border-bottom:1px solid #e3e6ea;font-size:14px;text-align:left}th{font-size:12px;text-transform:uppercase;color:#666}.n{text-align:right}.tot{text-align:right;font-size:20px;font-weight:800;margin-top:6px}.terms{font-size:11px;color:#777;margin-top:16px;border-top:1px solid #eee;padding-top:10px;white-space:pre-wrap}.acc{max-width:640px;margin:16px auto 0}button{width:100%;padding:15px;font-size:16px;font-weight:700;border:0;border-radius:10px;margin:7px 0;color:#fff;cursor:pointer}.a{background:#16a34a}.r{background:#dc2626}.estado{max-width:640px;margin:16px auto 0;padding:16px;border-radius:10px;background:#e8f0ff;font-weight:700;text-align:center}";

export function renderQuoteDoc(d: DatosCotizacion): string {
  const { quote: q, biz, cliente, numero, fecha, token } = d;
  const rows = q.items.map((l) => `<tr><td>${esc(l.description)}</td><td class="n">${l.quantity}</td><td class="n">$${l.unitPrice.toFixed(2)}</td><td class="n">$${l.lineTotal.toFixed(2)}</td></tr>`).join("");
  const t = esc(token);
  const acc = q.decision
    ? `<div class="estado">${q.decision === "accepted" ? "Aceptaste esta cotizacion. Gracias, nuestro equipo coordinara contigo." : "Rechazaste esta cotizacion."}</div>`
    : `<div class="acc"><form method="POST" action="/q/${t}/accept"><button class="a">Aceptar cotizacion</button></form><form method="POST" action="/q/${t}/reject"><button class="r">Rechazar</button></form></div>`;
  const logo = biz.logoUrl ? `<img class="logo" src="${esc(biz.logoUrl)}" alt="">` : "";
  const info = esc([biz.phone, biz.email, biz.address].filter(Boolean).join(" · "));
  return `<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Cotizacion ${esc(numero)}</title><style>${STYLE}</style></head><body><div class="doc"><div class="head"><div>${logo}<div class="biz">${esc(biz.name)}</div><div class="sub">${info}</div></div><div class="right"><div class="title">COTIZACION</div><div class="sub">${esc(numero)}</div><div class="sub">${esc(fecha)}</div></div></div><div class="para"><b>Cliente:</b> ${esc(cliente.nombre)}${cliente.telefono ? `<br>Tel: ${esc(cliente.telefono)}` : ""}${cliente.email ? `<br>Email: ${esc(cliente.email)}` : ""}${cliente.direccion ? `<br>Direccion: ${esc(cliente.direccion)}` : ""}</div>${q.conclusion ? `<p class="desc">${esc(q.conclusion)}</p>` : ""}<table><thead><tr><th>Detalle</th><th class="n">Cant.</th><th class="n">Precio</th><th class="n">Total</th></tr></thead><tbody>${rows}</tbody></table><div class="tot">Total: $${q.total.toFixed(2)}</div>${biz.terms ? `<div class="terms">${esc(biz.terms)}</div>` : ""}</div>${acc}</body></html>`;
}

export function pageSimple(msg: string): string {
  return `<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Cotizacion</title><style>${STYLE}</style></head><body><div class="estado">${esc(msg)}</div></body></html>`;
}
