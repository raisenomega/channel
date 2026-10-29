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
  readonly body: string;
  readonly rejectionReason: string | null;
}

function cuerpoDe(x: Record<string, unknown>): string {
  const comps = Array.isArray(x.components) ? x.components as Array<Record<string, unknown>> : [];
  const bodyComp = comps.find((c) => String(c?.type ?? "").toUpperCase() === "BODY");
  return bodyComp ? String(bodyComp.text ?? "") : "";
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
      body: cuerpoDe(x),
      rejectionReason: x.rejected_reason ? String(x.rejected_reason) : (x.rejection_reason ? String(x.rejection_reason) : null),
    }));
  } catch {
    return [];
  }
}
