import { expect, test } from "vitest";
import { escapeHtml, renderPagoPage } from "../../../src/pay/infrastructure/landing-page.renderer.ts";

function data(over: Partial<Parameters<typeof renderPagoPage>[0]> = {}) {
  return {
    tenantName: "Zafacones Ramos", logoUrl: "https://img.example.com/logo.png", primaryColor: "#4f46e5",
    orderTotal: 10, currency: "USD", orderDescription: "Compra", items: [{ description: "Item 1", quantity: 1, unitPrice: 10, total: 10 }],
    csrfToken: "t1.mac", cspNonce: "nonce_abc", stripePublishableKey: "pk_test_123", orderId: "ord_1", tenantSlug: "zafacones-ramos",
    ...over,
  };
}

test("XSS: tenant name con <script> queda escapado", () => {
  const html = renderPagoPage(data({ tenantName: "<script>alert(1)</script>" }));
  expect(html).toContain("&lt;script&gt;alert(1)&lt;/script&gt;");
  expect(html).not.toContain("<script>alert(1)</script>");
});

test("XSS: descripción de item con <img onerror> queda escapada", () => {
  const html = renderPagoPage(data({ items: [{ description: `<img src=x onerror=alert(1)>`, quantity: 1, unitPrice: 5, total: 5 }] }));
  expect(html).not.toContain("<img src=x onerror=");
  expect(html).toContain("&lt;img src=x onerror=alert(1)&gt;");
});

test("XSS: logo_url con comillas/atributos escapado", () => {
  const html = renderPagoPage(data({ logoUrl: `" onerror="alert(1)"` }));
  expect(html).not.toContain(`" onerror="`);
});

test("escapeHtml reemplaza & < > \" '", () => {
  expect(escapeHtml(`<a href="x" title='y'>&</a>`)).toBe("&lt;a href=&quot;x&quot; title=&#39;y&#39;&gt;&amp;&lt;/a&gt;");
});

test("CSP nonce aplicado a script y style inline", () => {
  const html = renderPagoPage(data({ cspNonce: "NONCE_XYZ" }));
  expect(html).toContain('nonce="NONCE_XYZ"');
});

test("Stripe.js embed presente cuando hay publishable key", () => {
  const html = renderPagoPage(data({ stripePublishableKey: "pk_live_123" }));
  expect(html).toContain('src="https://js.stripe.com/v3/"');
});

test("Stripe publishable key va en el render como const stripe", () => {
  const html = renderPagoPage(data({ stripePublishableKey: "pk_test_abc" }));
  expect(html).toContain("pk_test_abc");
});

test("logo_url null -> placeholder HUB", () => {
  const html = renderPagoPage(data({ logoUrl: null }));
  expect(html).toContain("logo-fallback");
  expect(html).toContain("HUB");
});

test("logo_url presente -> <img> con alt de nombre escapado", () => {
  const html = renderPagoPage(data({ logoUrl: "https://x/logo.png", tenantName: "A&B" }));
  expect(html).toContain("<img src=\"https://x/logo.png\"");
  expect(html).toContain("alt=\"A&amp;B logo\"");
});

test("items se renderizan; sin quote no hay items -> usa descripción/orderDescription", () => {
  const html = renderPagoPage(data({ items: [], orderDescription: "Nota de la orden" }));
  expect(html).toContain("Nota de la orden");
});