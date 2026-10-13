import { Result, err, ok } from "./result.ts";

export interface Money {
  readonly amount: number;   // en centavos (entero)
  readonly currency: string; // ISO 4217
}

export const crearMoney = (
  monto: number,
  moneda: string,
): Result<Money, MoneyError> => {
  if (!Number.isInteger(monto)) return err({ kind: "non_integer_amount" as const });
  if (monto < 0) return err({ kind: "negative_amount" as const });
  return ok(Object.freeze({ amount: monto, currency: moneda.toUpperCase() }));
};

export type MoneyError =
  | { readonly kind: "non_integer_amount" }
  | { readonly kind: "negative_amount" };