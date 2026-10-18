/**
 * HUB by Raisen — O-8 adversarial A-O-8: las cards de /channels y /reportes comparten el mismo
 * shell visual (glass-card + padding p-3.5). Previene drift de tamanio/padding/radius entre vistas.
 */
import { expect, test } from "vitest";
import { readFileSync } from "node:fs";

const CARD = readFileSync("apps/tanstack/src/routes/channels-ui/channel-card.tsx", "utf8");
const KPI = readFileSync("apps/tanstack/src/components/ui/kpi.tsx", "utf8");  // card de /reportes

test("A-O-8: ChannelCard usa el mismo padding que la card de /reportes (p-3.5, no p-4)", () => {
  expect(KPI).toContain("glass-card p-3.5");           // referencia: card de /reportes
  expect(CARD).toContain("p-3.5");                     // /channels alineado
  expect(CARD).toContain("padded={false}");            // evita el p-4 por defecto del primitivo Card
});
