import { Result, err, ok } from "./result.ts";

export class Email {
  private constructor(private readonly value: string) {
    Object.freeze(this);
  }

  static crear(raw: string): Result<Email, EmailError> {
    const v = raw.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) {
      return err({ kind: "invalid_email" as const, value: raw });
    }
    return ok(new Email(v));
  }

  get valor(): string {
    return this.value;
  }
}

export type EmailError = { readonly kind: "invalid_email"; readonly value: string };