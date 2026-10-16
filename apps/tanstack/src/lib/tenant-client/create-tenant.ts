/**
 * HUB by Raisen — Wrapper para POST /tenants.
 */
export interface CreateTenantInput {
  name: string; email: string; phone: string;
}

export interface CreateTenantResult {
  readonly id: string;
  readonly name: string;
}

export async function createTenant(input: CreateTenantInput): Promise<CreateTenantResult> {
  const res = await fetch("/api/tenants", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(input),
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(body || "POST /tenants failed");
  }
  return res.json() as Promise<CreateTenantResult>;
}