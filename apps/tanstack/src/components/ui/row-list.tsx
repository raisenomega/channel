/**
 * HUB by Raisen — Lista de filas global por defecto (espejo de Agendados): contenedor con borde,
 * 16 por pagina + paginacion "< n / N >". renderRow pinta cada fila (incluye su propia key). Usar en
 * Cotizaciones, Agendados y demas paginas para filas de tamano y paginacion consistentes. C4 <=75.
 */
import { useState, type ReactNode } from "react";

export function RowList<T>({ items, pageSize = 16, renderRow }: {
  items: readonly T[]; pageSize?: number; renderRow: (item: T) => ReactNode;
}) {
  const [page, setPage] = useState(0);
  const pages = Math.max(1, Math.ceil(items.length / pageSize));
  const slice = items.slice(page * pageSize, page * pageSize + pageSize);
  return (
    <div className="space-y-2">
      <div className="overflow-hidden rounded-xl border border-border/40">{slice.map(renderRow)}</div>
      {pages > 1 && (
        <div className="flex items-center justify-center gap-3 text-xs">
          <button type="button" className="chip" disabled={page === 0} onClick={() => setPage((p) => p - 1)}>&lt;</button>
          <span className="tabular-nums">{page + 1} / {pages}</span>
          <button type="button" className="chip" disabled={page >= pages - 1} onClick={() => setPage((p) => p + 1)}>&gt;</button>
        </div>
      )}
    </div>
  );
}
