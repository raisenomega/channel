import { expect, test } from "vitest";
import { readFileSync } from "node:fs";

/** A-14 WHITE_LABEL: R19 — "Zernio" jamás aparece en texto visible al cliente final.
 * En UI, solo los imports, nombres de función/componente y comentarios pueden contener "Zernio".
 * Strings en comillas (simples/dobles/backtick) visibles en UI no deben contener "Zernio". */
function uiStringsContainingZernio(path: string): string[] {
  const src = readFileSync(path, "utf-8");
  return src.split("\n").filter((l) => {
    if (!l.includes("Zernio")) return false;
    const t = l.trim();
    if (t.startsWith("import ") || t.startsWith("export") || t.startsWith("//") || t.startsWith("*") || t.startsWith("/*") || t.startsWith(" *")) return false;
    if (t.includes("HUB-DIFF")) return false;
    if (t.includes('"zernio-oauth"') || t.includes("'zernio-oauth'") || t.includes("`zernio-oauth`")) return false;
    if (t.includes("zernio_") || t.includes("zernio-") || t.includes("<ZernioConnectButton")) return false;
    return true;
  });
}

test("A-14 WHITE_LABEL: ZernioConnectButton.tsx no expone 'Zernio' en UI", () => {
  const lines = uiStringsContainingZernio("src/components/channels/ZernioConnectButton.tsx");
  expect(lines.length).toBe(0);
});

test("A-14 WHITE_LABEL: ZernioReturn.tsx no expone 'Zernio' en UI", () => {
  const lines = uiStringsContainingZernio("src/components/channels/ZernioReturn.tsx");
  expect(lines.length).toBe(0);
});

test("A-14 WHITE_LABEL: SectionSocialAccounts.tsx no expone 'Zernio' en UI", () => {
  const lines = uiStringsContainingZernio("src/components/onboarding/sections/SectionSocialAccounts.tsx");
  expect(lines.length).toBe(0);
});