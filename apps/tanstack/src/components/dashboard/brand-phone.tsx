/**
 * HUB by Raisen — Celular Samsung S25 con la app de cada red social y su
 * identidad visual REAL. Carcasa .wa-phone/.wa-screen del CSS aislado;
 * la pantalla se tiñe del color de marca. Los submódulos de especificaciones,
 * iconos y cabeceras viven en components/dashboard/brand (C4 ≤75 líneas).
 */
import type { ReactNode } from "react";
import { BRANDS, type BrandKind } from "@/components/dashboard/brand/brand-specs";
import { BrandHeader } from "@/components/dashboard/brand/brand-headers";

export type { BrandKind } from "@/components/dashboard/brand/brand-specs";
export { BrandHeader } from "@/components/dashboard/brand/brand-headers";
export { gmailComposeStyle } from "@/components/dashboard/brand/brand-specs";
export { instagramGradient } from "@/components/dashboard/brand/brand-icons";
export { BRANDS };

/**
 * Carcasa Samsung S25 con la pantalla teñida del color de la marca.
 * children es el contenido de la app dentro del teléfono.
 */
export function BrandPhone({
  kind,
  children,
  header,
}: { kind: BrandKind; children?: ReactNode; header?: ReactNode }) {
  const { bg, barColor } = BRANDS[kind];

  return (
    <div className="wa-phone">
      <div className="wa-screen" style={{ background: bg }}>
        <span className="wa-punch" />
        {header ?? <BrandHeader kind={kind} />}
        <div
          style={{
            flex: 1,
            minHeight: 0,
            overflowY: "auto",
            display: "flex",
            flexDirection: "column",
            background: bg,
            color: barColor,
          }}
        >
          {children}
        </div>
      </div>
    </div>
  );
}