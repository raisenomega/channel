/**
 * HUB by Raisen — Documento comercial generico (cotizacion/factura/orden), estilo Nucleo: marca
 * (logo + compañia) + caja cliente + tabla de lineas + Subtotal/Tax/TOTAL + marca de agua + pie corto
 * + Terminos y condiciones. Mismo render para todo el ciclo (solo cambia el titulo). 3 estilos. C4 <=75.
 */
import type { CSSProperties } from "react";
import type { PdfStyleDef } from "./pdf-styles";
import type { BizInfo } from "./pdf-business-info";
import type { DocItem, DocClient, DocTotals } from "./doc-types";
import { DocTable } from "./doc-table";

export interface DocLabels { subtotal: string; tax: string; total: string; client: string; terms: string; }

export function BusinessDocument({ title, style, biz, refId, client, items, totals, headers, labels, watermark }: {
  title: string; style: PdfStyleDef; biz: BizInfo; refId: string; client: DocClient;
  items: DocItem[]; totals: DocTotals; headers: string[]; labels: DocLabels; watermark?: string;
}) {
  const a = style.accent;
  const minimal = style.id === "minimal";
  const accent = minimal ? "#333" : a;
  const money = (n: number): string => `${totals.currency} ${Number(n).toFixed(2)}`;
  const muted: CSSProperties = { color: "#666", fontSize: 11 };
  const tr: CSSProperties = { display: "flex", justifyContent: "space-between", padding: "3px 0", fontSize: 12, width: 240, marginLeft: "auto" };
  return (
    <div style={{ position: "relative", overflow: "hidden", background: "#fff", color: "#1a1a1a", width: "100%", maxWidth: 720, margin: "0 auto", padding: 40, fontFamily: "Arial, Helvetica, sans-serif" }}>
      {watermark ? <div style={{ position: "absolute", top: "42%", left: 0, right: 0, textAlign: "center", transform: "rotate(-24deg)", fontSize: 76, fontWeight: 700, color: "rgba(0,0,0,0.06)", letterSpacing: 4 }}>{watermark}</div> : null}
      <div style={{ position: "relative", display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <div style={{ fontSize: minimal ? 16 : 24, fontWeight: 700, letterSpacing: minimal ? 2 : 0, textTransform: minimal ? "uppercase" : "none", color: accent }}>{title}</div>
          <div style={{ color: "#888", marginTop: 2, fontSize: 12 }}>#{refId}</div>
        </div>
        <div style={{ textAlign: "right" }}>
          {biz.logoUrl ? <img src={biz.logoUrl} alt="" style={{ height: 40, objectFit: "contain", marginLeft: "auto", marginBottom: 6, display: "block" }} /> : null}
          <div style={{ fontSize: 15, fontWeight: 700 }}>{biz.name}</div>
          {biz.address ? <div style={muted}>{biz.address}</div> : null}
          {biz.phone ? <div style={muted}>{biz.phone}</div> : null}
          {biz.email ? <div style={muted}>{biz.email}</div> : null}
        </div>
      </div>
      {style.id === "moderno" ? <div style={{ height: 3, background: a, margin: "16px 0 0" }} /> : null}
      <div style={{ position: "relative", marginTop: 20, background: "#fafafa", padding: "10px 12px", borderRadius: 6 }}>
        <div style={{ fontSize: 10, fontWeight: 700, color: "#888", textTransform: "uppercase" }}>{labels.client}</div>
        <div style={{ fontWeight: 700 }}>{client.name}</div>
        {client.lines.filter(Boolean).map((l, i) => <div key={i} style={muted}>{l}</div>)}
      </div>
      <div style={{ position: "relative" }}>
        <DocTable accent={accent} headers={headers} items={items} money={money} />
        <div style={{ marginTop: 10 }}>
          <div style={tr}><span style={muted}>{labels.subtotal}</span><span>{money(totals.subtotal)}</span></div>
          <div style={tr}><span style={muted}>{labels.tax}</span><span>{money(totals.tax)}</span></div>
          <div style={{ ...tr, borderTop: "2px solid " + accent, paddingTop: 6, fontWeight: 700, fontSize: 15 }}><span>{labels.total}</span><span>{money(totals.total)}</span></div>
        </div>
      </div>
      {biz.footer1 ? <div style={{ position: "relative", marginTop: 28, fontSize: 11, color: "#555", textAlign: "center" }}>{biz.footer1}</div> : null}
      {biz.terms ? <div style={{ position: "relative", marginTop: 16, paddingTop: 8, borderTop: "1px solid #eee" }}><div style={{ fontSize: 10, fontWeight: 700, color: "#888", textTransform: "uppercase", marginBottom: 3 }}>{labels.terms}</div><div style={{ fontSize: 9, color: "#777", lineHeight: 1.5 }}>{biz.terms}</div></div> : null}
    </div>
  );
}
