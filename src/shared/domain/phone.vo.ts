import { Result, err, ok } from "./result.ts";

export class Phone {
  private constructor(private readonly value: string) {
    Object.freeze(this);
  }

  static crear(raw: string): Result<Phone, PhoneError> {
    const v = raw.replace(/[^\d+]/g, "");
    if (!/^\+?[1-9]\d{7,14}$/.test(v)) {
      return err({ kind: "invalid_phone" as const, value: raw });
    }
    return ok(new Phone(v.startsWith("+") ? v : `+${v}`));
  }

  get valor(): string {
    return this.value;
  }
}

export type PhoneError = { readonly kind: "invalid_phone"; readonly value: string };