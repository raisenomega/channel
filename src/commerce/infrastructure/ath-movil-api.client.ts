/**
 * HUB by Raisen — Cliente HTTP ATH Movil Business ECommerce (REAL, 3.2a-BIS).
 * Fuente: github.com/evertec/ATHM-Payment-Button-API. Host unico, SIN sandbox.
 * Flujo: /payment -> /business/updatePhoneNumber -> /business/findPayment -> /authorization.
 * Estados MAYÚSCULA exacta. Nunca loguea tokens. C4 <=75.
 */
import { ok, err } from "../../shared/domain/result.ts";
import type { Result } from "../../shared/domain/result.ts";

const ATH_BASE = "https://payments.athmovil.com/api/business-transaction/ecommerce";
export type AthEstado = "OPEN" | "CONFIRM" | "COMPLETED" | "CANCEL";
const ESTADOS = ["OPEN", "CONFIRM", "COMPLETED", "CANCEL"] as const;

export interface AthPaymentTicket { readonly ecommerceId: string; readonly authToken: string; }
export interface AthMovilTransaction {
  readonly ecommerceId: string; readonly referenceNumber: string;
  readonly estado: AthEstado; readonly total: number; readonly fee: number;
  readonly netAmount: number; readonly date: string;
}

function mapTxn(ecommerceId: string, d: Record<string, unknown>): Result<AthMovilTransaction, string> {
  const estado = String(d.ecommerceStatus ?? "");
  if (!(ESTADOS as readonly string[]).includes(estado)) return err("estado_desconocido");
  return ok({ ecommerceId, referenceNumber: String(d.referenceNumber ?? ""),
    estado: estado as AthEstado, total: Number(d.total ?? 0), fee: Number(d.fee ?? 0),
    netAmount: Number(d.netAmount ?? 0), date: String(d.transactionDate ?? new Date().toISOString()) });
}

export class AthMovilApiClient {
  constructor(
    private readonly publicToken: string,
    private readonly privateToken: string,
    private readonly base: string = ATH_BASE,
  ) {}
  async crearPago(input: { total: number; tax: number; subtotal: number; metadata1: string;
    metadata2: string; items: ReadonlyArray<{ name: string; description: string; quantity: number; price: number }>;
    phoneNumber?: string; timeout: number; }): Promise<Result<AthPaymentTicket, string>> {
    const res = await this.post("/payment", undefined, { env: "production", publicToken: this.publicToken,
      timeout: input.timeout, total: input.total, tax: input.tax, subtotal: input.subtotal,
      metadata1: input.metadata1, metadata2: input.metadata2,
      items: input.items.map((i) => ({ ...i, tax: 0, metadata: "" })),
      ...(input.phoneNumber ? { phoneNumber: input.phoneNumber } : {}) });
    if (!res.ok) return err(`http_${res.status}`);
    const data = await this.data(res);
    return ok({ ecommerceId: String(data.ecommerceId), authToken: String(data.auth_token) });
  }

  async actualizarTelefono(ecommerceId: string, phoneNumber: string, authToken: string): Promise<Result<void, string>> {
    const res = await this.put("/business/updatePhoneNumber", authToken, { ecommerceId, phoneNumber });
    return res.ok ? ok(undefined) : err(`http_${res.status}`);
  }

  async buscarPago(ecommerceId: string): Promise<Result<AthMovilTransaction, string>> {
    const res = await this.post("/business/findPayment", undefined, { ecommerceId, publicToken: this.publicToken });
    if (!res.ok) return err(`http_${res.status}`);
    return mapTxn(ecommerceId, await this.data(res));
  }
  async autorizar(authToken: string): Promise<Result<AthMovilTransaction, string>> {
    const res = await this.post("/authorization", authToken, {});
    if (!res.ok) return err(`http_${res.status}`);
    return mapTxn("", await this.data(res));
  }

  private async data(res: Response): Promise<Record<string, unknown>> {
    const j = await res.json() as { data?: Record<string, unknown> };
    return j.data ?? {};
  }
  private async post(path: string, authToken: string | undefined, body: Record<string, unknown>): Promise<Response> {
    const h: Record<string, string> = authToken ? { "Content-Type": "application/json", Authorization: `Bearer ${authToken}` } : { "Content-Type": "application/json" };
    return fetch(`${this.base}${path}`, { method: "POST", headers: h, body: JSON.stringify(body) });
  }
  private async put(path: string, authToken: string, body: Record<string, unknown>): Promise<Response> {
    return fetch(`${this.base}${path}`, { method: "PUT", headers: { "Content-Type": "application/json", Authorization: `Bearer ${authToken}` }, body: JSON.stringify(body) });
  }
}