# Dominio — Value Object `Phone`

## Responsabilidad
Teléfono normalizado (E.164) y autovalidado.

## Implementación
```ts
export class Phone {
  private constructor(private readonly value: string) {
    Object.freeze(this);
  }

  static crear(raw: string): Result<Phone, PhoneError> {
    const v = raw.replace(/[^\d+]/g, '');
    if (!/^\+?[1-9]\d{7,14}$/.test(v)) {
      return err({ kind: 'invalid_phone', value: raw });
    }
    return ok(new Phone(v));
  }

  get valor(): string { return this.value; }
}
```

## Reglas
- Formato E.164 (`+` opcional + 8–15 dígitos).
- `Object.freeze` para inmutabilidad.
- Error tipado `PhoneError`, no `string`.
