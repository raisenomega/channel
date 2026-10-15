/**
 * HUB by Raisen — Cliente HTTP de Stripe Connect API (REST, form-encoded).
 * Idempotency-Key + Stripe-Version pinned + Stripe-Account. Zero deps.
 * C4 ≤75 lineas.
 */
import { Result, err, ok } from "../../shared/domain/result.ts";

const BASE = "https://api.stripe.com/v1";

export interface StripePaymentIntent {
  readonly id: string;
  readonly clientSecret: string;
  readonly status: string;
  readonly amount: number;
}
export interface StripeRefund { readonly id: string; }

export class StripeApiClient {
  constructor(private readonly secretKey: string, private readonly apiVersion: string) {}

  private headers(stripeAccount?: string, idempotencyKey?: string): Record<string, string> {
    const h: Record<string, string> = {
      Authorization: `Bearer ${this.secretKey}`,
      "Stripe-Version": this.apiVersion,
      "Content-Type": "application/x-www-form-urlencoded",
    };
    if (stripeAccount) h["Stripe-Account"] = stripeAccount;
    if (idempotencyKey) h["Idempotency-Key"] = idempotencyKey;
    return h;
  }

  private body(params: Record<string, unknown>): string {
    return new URLSearchParams(params as Record<string, string>).toString();
  }

  async crearPaymentIntent(p: {
    amount: number; currency: string; stripeAccount: string;
    idempotencyKey: string; applicationFeeAmount?: number; metadata?: Record<string, string>;
  }): Promise<Result<StripePaymentIntent, string>> {
    const res = await this.post("/payment_intents", p.stripeAccount, p.idempotencyKey, {
      amount: p.amount, currency: p.currency,
      ...(p.applicationFeeAmount ? { application_fee_amount: p.applicationFeeAmount } : {}),
      ...(p.metadata ? Object.fromEntries(Object.entries(p.metadata).map(([k, v]) => [`metadata[${k}]`, v])) : {}),
    });
    return this.map(res, (d) => ({ id: String(d.id), clientSecret: String(d.client_secret ?? ""), status: String(d.status), amount: Number(d.amount) }));
  }

  async crearRefund(p: { paymentIntent: string; stripeAccount: string; idempotencyKey: string }): Promise<Result<StripeRefund, string>> {
    const res = await this.post("/refunds", p.stripeAccount, p.idempotencyKey, { payment_intent: p.paymentIntent });
    return this.map(res, (d) => ({ id: String(d.id) }));
  }

  async crearAccount(p: { type: "express" | "standard"; country: string; email: string }): Promise<Result<{ id: string }, string>> {
    const res = await this.post("/accounts", undefined, `acct_${p.email}`, { type: p.type, country: p.country, email: p.email });
    return this.map(res, (d) => ({ id: String(d.id) }));
  }

  async crearAccountLink(p: { account: string; refreshUrl: string; returnUrl: string }): Promise<Result<{ url: string }, string>> {
    const res = await this.post("/account_links", undefined, `link_${p.account}`, { account: p.account, type: "account_onboarding", refresh_url: p.refreshUrl, return_url: p.returnUrl });
    return this.map(res, (d) => ({ url: String(d.url) }));
  }

  private async post(path: string, account: string | undefined, idemKey: string | undefined, params: Record<string, unknown>): Promise<Response> {
    return fetch(`${BASE}${path}`, { method: "POST", headers: this.headers(account, idemKey), body: this.body(params) });
  }

  private async map<T>(res: Response, toDto: (d: Record<string, unknown>) => T): Promise<Result<T, string>> {
    if (!res.ok) return err(`http_${res.status}`);
    return ok(toDto(await res.json() as Record<string, unknown>));
  }
}