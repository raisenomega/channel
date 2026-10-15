/**
 * HUB by Raisen — Cliente HTTP de ATH Movil Business ECommerce API.
 * Solo /finalize (pull-model). Nunca loguea tokens ni respuestas crudas.
 * C4 ≤75 lineas.
 */
import { Result, err, ok } from "../../shared/domain/result.ts";

const BASES: Record<"sandbox" | "prod", string> = {
  sandbox: "https://payments.sandbox.evertecinc.com",
  prod: "https://payments.evertecinc.com",
};

export interface AthMovilTransaction {
  readonly referenceNumber: string;
  readonly status: "completed" | "cancelled" | "expired";
  readonly total: number;
  readonly date: string;
}

export class AthMovilApiClient {
  constructor(
    private readonly env: "sandbox" | "prod",
    private readonly privateToken: string,
    private readonly publicToken: string,
  ) {}

  async finalizar(referenceNumber: string): Promise<Result<AthMovilTransaction, string>> {
    const base = BASES[this.env];
    const url = `${base}/ecommerce/transactions/pending/${encodeURIComponent(referenceNumber)}/finalize`;
    try {
      const resp = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ publicToken: this.publicToken, privateToken: this.privateToken }),
      });
      if (!resp.ok) return err(`http_${resp.status}`);
      const data = await resp.json() as Record<string, unknown>;
      const status = String(data.ecommerceStatus ?? data.status ?? "");
      const total = Number(data.total ?? 0);
      return ok(Object.freeze({
        referenceNumber: String(data.referenceNumber ?? referenceNumber),
        status: (status === "completed" || status === "cancelled" || status === "expired" ? status : "cancelled"),
        total,
        date: String(data.date ?? new Date().toISOString()),
      }));
    } catch (e) { return err(String(e)); }
  }
}