/**
 * HUB by Raisen — Tabla de lineas del documento: Descripcion · Cantidad · Precio · Total.
 * (El tax va a nivel documento, no por linea.) Encabezado con color. Estilos INLINE. C4 <=75.
 */
import type { CSSProperties } from "react";
import type { DocItem } from "./doc-types";

const W = [52, 14, 17, 17];
const RIGHT = [false, true, true, true];

export function DocTable({ accent, headers, items, money }: {
  accent: string; headers: string[]; items: DocItem[]; money: (n: number) => string;
}) {
  const th: CSSProperties = { background: accent, color: "#fff", padding: "6px 8px", fontSize: 10, fontWeight: 700 };
  const td: CSSProperties = { padding: "6px 8px", fontSize: 11, borderBottom: "1px solid #eee" };
  const cells = (it: DocItem): string[] => [it.description, String(it.quantity), money(it.unitPrice), money(it.lineTotal)];
  return (
    <table style={{ width: "100%", borderCollapse: "collapse", marginTop: 8 }}>
      <thead>
        <tr>{headers.map((h, i) => <th key={i} style={{ ...th, textAlign: RIGHT[i] ? "right" : "left", width: `${W[i]}%` }}>{h}</th>)}</tr>
      </thead>
      <tbody>
        {items.map((it, r) => (
          <tr key={r}>{cells(it).map((cv, i) => <td key={i} style={{ ...td, textAlign: RIGHT[i] ? "right" : "left" }}>{cv}</td>)}</tr>
        ))}
      </tbody>
    </table>
  );
}
