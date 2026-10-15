/**
 * HUB by Raisen — Generador de nonce CSP (Content-Security-Policy) (Slide 3.3).
 * Nonce aleatorio; el header CSP strict y el <script>/<style> inline comparten
 * el mismo nonce por request. C4 ≤40.
 */
export const generateNonce = (): string => {
  const raw = crypto.randomUUID().replace(/-/g, "");
  const hex = Array.from(new TextEncoder().encode(raw)).map((b) => b.toString(16)).join("");
  return btoa(hex).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
};