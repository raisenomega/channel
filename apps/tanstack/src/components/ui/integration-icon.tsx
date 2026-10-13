/**
 * HUB by Raisen — Iconos para integraciones del ecosistema.
 * Cada integración tiene un icono SVG distintivo (NUCLEO, OMEGA, POS,
 * TABLE, HEALTH, HOME, FLEET).
 */
import type { SVGProps } from "react";
import type { IntegrationType } from "@/lib/integrations-client";

const PATHS: Record<IntegrationType, string> = {
  nucleo: "M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5",
  omega: "M22 12c0 5.5-4.5 10-10 10S2 17.5 2 12 6.5 2 12 2s10 4.5 10 10zM8 12l4-4 4 4M12 8v8",
  pos: "M3 3h18v18H3V3zm4 4h10v2H7V7zm0 4h10v2H7v-2zm0 4h6v2H7v-2z",
  table: "M3 3h18v18H3V3zm2 2v14h14V5H5zm2 2h10v2H7V7zm0 4h10v2H7v-2zm0 4h10v2H7v-2z",
  health: "M12 3c-5 0-9 4-9 9s4 9 9 9 9-4 9-9-4-9-9-9zm0 4l2 5-2 2-2-5 2-2zm-4 5l2 2-5 3 3-5zm8 0l3 5-5-3 2-2zM3 12l5-3 2 2-5 3-2-2z",
  home: "M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V9zm3 3v9h12v-9m-6-4v4",
  fleet: "M4 16l4-4-4-4M20 8l-4 4 4 4M14 4l-4 16",
};

export function IntegrationIcon({
  kind,
  ...props
}: { kind: IntegrationType } & SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      <path d={PATHS[kind]} />
    </svg>
  );
}