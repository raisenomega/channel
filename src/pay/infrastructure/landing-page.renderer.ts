/**
 * HUB by Raisen — Renderer de la landing pública de cobro (Slide 3.3).
 * Template literals zero-deps. Todo valor dinámico pasa por escapeHtml (R16).
 * El nonce CSP se aplica al <script> y <style> inline. C4 ≤75.
 */

export interface PagoPageItem { readonly description: string; readonly quantity: number; readonly unitPrice: number; readonly total: number; }
export interface PagoPageData {
  readonly tenantName: string;
  readonly logoUrl: string | null;
  readonly primaryColor: string | null;
  readonly orderTotal: number;
  readonly currency: string;
  readonly orderDescription: string | null;
  readonly items: readonly PagoPageItem[];
  readonly csrfToken: string;
  readonly cspNonce: string;
  readonly stripePublishableKey: string | null;
  readonly orderId: string;
  readonly tenantSlug: string;
}

export const escapeHtml = (s: string): string =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");

export function renderPagoPage(data: PagoPageData): string {
  const itemsHtml = data.items.length > 0
    ? data.items.map((i) => `<li>${escapeHtml(i.description)} x${escapeHtml(String(i.quantity))} — $${Number(i.total).toFixed(2)}</li>`).join("")
    : `<li>${escapeHtml(data.orderDescription ?? "Compra")} — $${Number(data.orderTotal).toFixed(2)}</li>`;
  const logo = data.logoUrl ? `<img src="${escapeHtml(data.logoUrl)}" alt="${escapeHtml(data.tenantName)} logo" />` : `<div class="logo-fallback">HUB</div>`;
  const stripe = data.stripePublishableKey ? `<script nonce="${data.cspNonce}" src="https://js.stripe.com/v3/"></script>` : "";
  return `<!DOCTYPE html>
<html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escapeHtml(data.tenantName)} — Pago</title>${stripe}
<style nonce="${data.cspNonce}">
body{font-family:system-ui,sans-serif;margin:0;background:#f5f5f5;color:#111}
.card{max-width:480px;margin:48px auto;background:#fff;border-radius:12px;padding:24px;box-shadow:0 2px 12px rgba(0,0,0,.1)}
.logo-fallback,.logo-fallback{width:56px;height:56px;border-radius:8px;background:${escapeHtml(data.primaryColor ?? "#4f46e5")};color:#fff;display:flex;align-items:center;justify-content:center;font-weight:700}
.logo-fallback img{max-width:56px;max-height:56px}
ul{padding-left:20px}.btn{display:block;width:100%;padding:12px;margin:8px 0;border:0;border-radius:8px;font-size:16px;cursor:pointer;color:#fff;background:${escapeHtml(data.primaryColor ?? "#4f46e5")}}
.btn.secondary{background:#64748b}input{width:100%;padding:10px;margin:8px 0;border:1px solid #ccc;border-radius:8px}
.hidden{display:none}#status{margin-top:12px;font-weight:600}
</style></head><body><div class="card">
${logo}<h1>${escapeHtml(data.tenantName)}</h1><ul>${itemsHtml}</ul>
<p>Total: <strong>${escapeHtml(data.currency)} $${Number(data.orderTotal).toFixed(2)}</strong></p>
<input id="phone" type="tel" placeholder="Teléfono ATH Móvil" inputmode="numeric" />
<button class="btn" id="athBtn">Pagar con ATH Móvil</button>
<p id="status"></p>
</div>
<script nonce="${data.cspNonce}">
const orderId = ${JSON.stringify(data.orderId)};
const slug = ${JSON.stringify(data.tenantSlug)};
const csrf = ${JSON.stringify(data.csrfToken)};
const $ = (id)=>document.getElementById(id);
async function post(path, body){
  const r = await fetch(path,{method:"POST",headers:{"Content-Type":"application/json","X-CSRF-Token":csrf},body:JSON.stringify(body)});
  return r.json();
}
$("athBtn").addEventListener("click", async ()=>{
  const phoneNumber = $("phone").value;
  const r = await post("/pay/"+slug+"/"+orderId+"/ath-charge",{phoneNumber});
  if(!r.ok){$("status").textContent = "Error: "+r.error.kind; return;}
  $("athBtn").disabled = true; $("status").textContent = "Confirma el pago en tu app ATH Móvil...";
  let tries = 0;
  const t = setInterval(async ()=>{
    if(++tries > 60){clearInterval(t); $("status").textContent = "Si ya pagaste, te notificaremos."; return;}
    const p = await (await fetch("/pay/"+slug+"/"+orderId+"/ath-poll?ecommerceId="+r.ecommerceId)).json();
    if(p.estado === "completed"){clearInterval(t); location.href = "/pay/"+slug+"/"+orderId+"/success?ref="+p.referenceNumber;}
    else if(p.estado === "failed"){clearInterval(t); location.href = "/pay/"+slug+"/"+orderId+"/failed";}
  }, 5000);
});
${data.stripePublishableKey ? `const stripe = Stripe('${escapeHtml(data.stripePublishableKey)}');` : ""}
</script></body></html>`;
}