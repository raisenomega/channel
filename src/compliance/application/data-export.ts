import { Result } from "../../shared/domain/result.ts";
import { ContactId, TenantId } from "../../shared/domain/ids.ts";

export interface DataExportQuery {
  readonly tenantId: TenantId;
  readonly contactId?: ContactId;
  readonly format: "json" | "csv";
  readonly includeMessages?: boolean;
  readonly includeContacts?: boolean;
  readonly includeQuotes?: boolean;
  readonly includeOrders?: boolean;
  readonly includePayments?: boolean;
  readonly includeInteractions?: boolean;
}

export class DataExportValidator {
  validar(q: DataExportQuery): Result<void, string> {
    const anySelected = q.includeMessages || q.includeContacts || q.includeQuotes
      || q.includeOrders || q.includePayments || q.includeInteractions;
    if (!anySelected) return { ok: false, error: "Selecciona al menos un tipo de dato a exportar" };
    return { ok: true, value: undefined };
  }
}

export function formatAsCSV(data: Record<string, unknown>[]): string {
  if (!data || data.length === 0) return "";
  const headers = Object.keys(data[0] ?? {}).join(",");
  const rows = data.map((row) =>
    Object.values(row).map((v) => {
      if (v === null) return "";
      const s = String(v);
      return s.includes(",") || s.includes('"') ? `"${s.replace(/"/g, '""')}"` : s;
    }).join(",")
  ).join("\n");
  return `${headers}\n${rows}`;
}