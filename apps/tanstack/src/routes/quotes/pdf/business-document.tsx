/**
 * HUB by Raisen — Documento imprimible generico del ciclo (cotizacion/factura/orden). Mismo render,
 * 3 estilos (clasico/moderno/minimal), el titulo cambia por etapa. Estilos INLINE (preview = PDF).
 * Reutilizable tambien en Reportes. C4 <=75.
 */
import type { CSSProperties } from "react";
import type { PdfStyleDef } from "./pdf-styles";

export interface DocRow { label: string; value: string; }

export function BusinessDocument({ title, style, bizName, refId, rows, total }: {
  title: string; style: PdfStyleDef; bizName: string; refId: string;
  rows: DocRow[]; total: DocRow;
}) {
  const a = style.accent;
  const band = style.id === "moderno";
  const minimal = style.id === "minimal";
  const page: CSSProperties = { background: "#fff", color: "#1a1a1a", width: "100%", maxWidth: 720, margin: "0 auto", fontFamily: "Arial, Helvetica, sans-serif" };
  const row: CSSProperties = { display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid " + (minimal ? "#f0f0f0" : "#eee"), fontSize: 12 };
  const muted: CSSProperties = { color: "#666" };
  return (
    <div style={page}>
      {band ? (
        <div style={{ background: a, color: "#fff", padding: "24px 40px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div><div style={{ fontSize: 22, fontWeight: 700 }}>{title}</div><div style={{ opacity: 0.85, fontSize: 11, marginTop: 2 }}>#{refId}</div></div>
          <div style={{ fontWeight: 700, fontSize: 15 }}>{bizName}</div>
        </div>
      ) : (
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", padding: "40px 40px 0" }}>
          <div>
            <div style={{ fontSize: minimal ? 16 : 24, fontWeight: 700, letterSpacing: minimal ? 2 : 0, textTransform: minimal ? "uppercase" : "none", color: minimal ? "#333" : a }}>{title}</div>
            <div style={{ color: "#888", marginTop: 2, fontSize: 12 }}>#{refId}</div>
          </div>
          <div style={{ fontSize: 15, fontWeight: 700, textAlign: "right" }}>{bizName}</div>
        </div>
      )}
      <div style={{ padding: band ? "24px 40px 40px" : "20px 40px 40px" }}>
        {rows.map((r, i) => <div key={i} style={row}><span style={muted}>{r.label}</span><span>{r.value}</span></div>)}
        <div style={{ display: "flex", justifyContent: "space-between", marginTop: 18, paddingTop: 10, borderTop: minimal ? "1px solid #333" : "2px solid " + a, fontSize: 16, fontWeight: 700 }}>
          <span>{total.label}</span><span>{total.value}</span>
        </div>
        <div style={{ marginTop: 44, fontSize: 10, color: "#999", textAlign: "center" }}>{bizName}</div>
      </div>
    </div>
  );
}
