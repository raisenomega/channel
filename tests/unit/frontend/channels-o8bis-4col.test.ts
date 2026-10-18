/**
 * HUB by Raisen — O-8-bis adversariales A-O-8-bis-A-1..3: /channels y /reportes comparten el
 * MISMO grid parent de 4 columnas, y la card quedo compactada (engrane en vez de boton ancho +
 * sin la fila-label "Activo"). Source-grep: jsdom NO calcula layout en px, pero un grid parent
 * identico garantiza mismas columnas => mismo ancho de card (eje que el owner pidio igualar).
 * Compuertas #59/#60: el match de grid parent es condicion necesaria del match visual.
 */
import { expect, test } from "vitest";
import { readFileSync } from "node:fs";

const CH = readFileSync("apps/tanstack/src/routes/channels.tsx", "utf8");
const RP = readFileSync("apps/tanstack/src/routes/reports.tsx", "utf8");
const CARD = readFileSync("apps/tanstack/src/routes/channels-ui/channel-card.tsx", "utf8");

const GRID = /className="grid grid-cols-2 gap-3 sm:grid-cols-4"/;

test("A-O-8-bis-A-1 /channels y /reportes usan el mismo grid de 4 columnas (sm:grid-cols-4)", () => {
  expect(RP).toMatch(GRID);
  expect(CH).toMatch(GRID);
});

test("A-O-8-bis-A-2 ancho de card identico: el grid parent es exactamente igual en ambas vistas", () => {
  const grid = (s: string) => s.match(GRID)?.[0];
  expect(grid(CH)).toBeDefined();
  expect(grid(CH)).toBe(grid(RP)); // mismo string de grid => mismas columnas => mismo ancho
});

test("A-O-8-bis-A-3 card compactada: engrane (no boton ancho) + sin fila-label 'Activo'", () => {
  expect(CARD).toContain("padded={false}"); // conserva A-O-8 (glass-card p-3.5)
  expect(CARD).toContain("p-3.5");
  expect(CARD).toContain("<GearIcon />"); // configuracion via engrane compacto
  expect(CARD).not.toContain('className="w-full"'); // ya NO existe el boton ancho de configuracion
  expect(CARD).not.toMatch(/text-muted-foreground">\{t\(language, "channels\.active"\)\}/); // sin fila-label visible
});
