/**
 * HUB by Raisen — Documento imprimible generico del ciclo (cotizacion/factura/orden). Mismo render,
 * 3 estilos; muestra logo + datos del negocio (auto) + mensaje de pie configurable. El titulo cambia
 * por etapa. Estilos INLINE (preview = PDF). Reutilizable en Reportes. C4 <=75.
 */
import type { CSSProperties } from "react";
import type { PdfStyleDef } from "./pdf-styles";
import type { BizInfo } from "./pdf-business-info";

export interface DocRow { label: string; value: string; }

const muted: CSSProperties = { color: "#666", fontSize: 11 };

export function BusinessDocument({ title, style, biz, refId, rows, total }: {
  title: string; style: PdfStyleDef; biz: BizInfo; refId: string; rows: DocRow[]; total: DocRow;
}) {
  const a = style.accent;
  const minimal = style.id === "minimal";
  const rule = style.id === "moderno";
  const row: CSSProperties = { display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid " + (minimal ? "#f0f0f0" : "#eee"), fontSize: 12 };
  return (
    <div style={{ background: "#fff", color: "#1a1a1a", width: "100%", maxWidth: 720, margin: "0 auto", fontFamily: "Arial, Helvetica, sans-serif" }}>
      <div style={{ padding: "40px 40px 0", display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <div style={{ fontSize: minimal ? 16 : 24, fontWeight: 700, letterSpacing: minimal ? 2 : 0, textTransform: minimal ? "uppercase" : "none", color: minimal ? "#333" : a }}>{title}</div>
          <div style={{ color: "#888", marginTop: 2, fontSize: 12 }}>#{refId}</div>
        </div>
        <div style={{ textAlign: "right" }}>
          {biz.logoUrl ? <img src={biz.logoUrl} alt="" style={{ height: 40, objectFit: "contain", marginLeft: "auto", marginBottom: 6, display: "block" }} /> : null}
          <div style={{ fontSize: 15, fontWeight: 700 }}>{biz.name}</div>
          {biz.legalName ? <div style={muted}>{biz.legalName}</div> : null}
          {biz.taxId ? <div style={muted}>Tax ID: {biz.taxId}</div> : null}
          {biz.address ? <div style={muted}>{biz.address}</div> : null}
          {biz.phone ? <div style={muted}>{biz.phone}</div> : null}
        </div>
      </div>
      {rule ? <div style={{ height: 3, background: a, margin: "16px 40px 0" }} /> : null}
      <div style={{ padding: "20px 40px 0" }}>
        {rows.map((r, i) => <div key={i} style={row}><span style={{ color: "#666" }}>{r.label}</span><span>{r.value}</span></div>)}
        <div style={{ display: "flex", justifyContent: "space-between", marginTop: 18, paddingTop: 10, borderTop: minimal ? "1px solid #333" : "2px solid " + a, fontSize: 16, fontWeight: 700 }}>
          <span>{total.label}</span><span>{total.value}</span>
        </div>
      </div>
      <div style={{ margin: "36px 40px 40px", paddingTop: 10, borderTop: "1px solid #eee", fontSize: 10, color: "#777", textAlign: "center" }}>
        {biz.footer ? <div style={{ marginBottom: 4 }}>{biz.footer}</div> : null}
        <div>{biz.name}</div>
      </div>
    </div>
  );
}
