/**
 * HUB by Raisen — Estado EN VIVO de plantillas desde Meta (via Zernio GET /templates).
 * Para saber cuales estan APPROVED/PENDING/REJECTED. Degrade-safe (lista vacia si falla). C4 <=75.
 */
const BASE = "https://zernio.com/api";

export interface ZernioTplStatus {
  readonly name: string;
  readonly language: string;
  readonly status: string;
  readonly category: string;
}

export async function listarEstadoZernio(apiKey: string, accountId: string): Promise<ZernioTplStatus[]> {
  if (!apiKey || !accountId) return [];
  try {
    const res = await fetch(`${BASE}/v1/whatsapp/templates?accountId=${encodeURIComponent(accountId)}`, {
      headers: { Authorization: `Bearer ${apiKey}` },
    });
    if (!res.ok) return [];
    const j = (await res.json()) as { templates?: ReadonlyArray<Record<string, unknown>> };
    const arr = Array.isArray(j.templates) ? j.templates : [];
    return arr.map((x) => ({
      name: String(x.name ?? ""), language: String(x.language ?? ""),
      status: String(x.status ?? ""), category: String(x.category ?? ""),
    }));
  } catch {
    return [];
  }
}
