/**
 * HUB by Raisen — SimpleListView: lista reutilizable para las pestañas
 * globales (agentes, plantillas, documentos) con titulo y estado vacío.
 */
import type { ReactNode } from "react";

export interface SimpleItem {
  id: string;
  name: string;
  secondary: string;
  trailing?: string;
  right?: ReactNode;
}

export function SimpleListView({ title, empty, items, accent }: {
  title: string;
  empty: string;
  items: readonly SimpleItem[];
  accent: string;
}) {
  return (
    <div>
      <h4 style={{ fontSize: 13, fontWeight: 700, color: `hsl(${accent})`, marginBottom: 10 }}>{title}</h4>
      {items.length === 0 ? (
        <p style={{ fontSize: 12, color: "var(--muted-foreground)" }}>{empty}</p>
      ) : (
        <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 6 }}>
          {items.map((it) => (
            <li key={it.id} style={{ borderLeft: `3px solid hsl(${accent})`, paddingLeft: 10 }}>
              <span style={{ fontWeight: 600, fontSize: 13 }}>{it.name}</span>
              {it.secondary ? <span style={{ fontSize: 11, color: "var(--muted-foreground)", marginLeft: 6 }}>{it.secondary}</span> : null}
              {it.trailing != null ? <span style={{ fontSize: 11, color: "var(--muted-foreground)", float: "right" }}>{it.trailing}</span> : null}
              {it.right ?? null}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}