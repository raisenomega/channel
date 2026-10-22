/**
 * HUB by Raisen — Documento imprimible de la Cotizacion (HTML con estilos INLINE para que se vea
 * igual en la vista previa y en la ventana de impresion -> "Guardar como PDF"). Sin dependencias.
 * Recibe labels ya traducidos. C4 <=75.
 */
import type { CSSProperties } from "react";
import type { QuoteListItem } from "@/lib/quotes-client";

export interface PdfLabels {
  title: string; contact: string; date: string; status: string; statusValue: string;
  expires: string; total: string; footer: string;
}

const row: CSSProperties = { display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid #eee", fontSize: 12 };
const muted: CSSProperties = { color: "#666" };

export function QuoteDocument({ quote, contactName, bizName, labels }: {
  quote: QuoteListItem; contactName: string; bizName: string; labels: PdfLabels;
}) {
  return (
    <div style={{ background: "#fff", color: "#1a1a1a", padding: 40, width: "100%", maxWidth: 720, margin: "0 auto", fontFamily: "Arial, Helvetica, sans-serif" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 28 }}>
        <div>
          <div style={{ fontSize: 24, fontWeight: 700 }}>{labels.title}</div>
          <div style={{ color: "#888", marginTop: 2, fontSize: 12 }}>#{quote.id.slice(0, 8)}</div>
        </div>
        <div style={{ fontSize: 15, fontWeight: 700, textAlign: "right" }}>{bizName}</div>
      </div>
      <div style={row}><span style={muted}>{labels.contact}</span><span>{contactName}</span></div>
      <div style={row}><span style={muted}>{labels.date}</span><span>{new Date(quote.createdAt).toLocaleDateString()}</span></div>
      <div style={row}><span style={muted}>{labels.status}</span><span>{labels.statusValue}</span></div>
      {quote.expiresAt ? (
        <div style={row}><span style={muted}>{labels.expires}</span><span>{new Date(quote.expiresAt).toLocaleDateString()}</span></div>
      ) : null}
      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 18, paddingTop: 10, borderTop: "2px solid #333", fontSize: 16, fontWeight: 700 }}>
        <span>{labels.total}</span><span>{quote.currency} {quote.totalAmount.toFixed(2)}</span>
      </div>
      <div style={{ marginTop: 44, fontSize: 10, color: "#999", textAlign: "center" }}>{bizName} - {labels.footer}</div>
    </div>
  );
}
