# Dominio — Value Object `Email`

## Responsabilidad
Email normalizado y autovalidado. Ejemplo canónico de VO puro.

## Implementación (patrón canónico)
```ts
export class Email {
  private constructor(private readonly value: string) {
    Object.freeze(this);
  }

  static crear(raw: string): Result<Email, EmailError> {
    const v = raw.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) {
      return err({ kind: 'invalid_email', value: raw });
    }
    return ok(new Email(v));
  }

  get valor(): string { return this.value; }
}
```

## Reglas
- Normaliza a minúsculas y sin espacios.
- `Object.freeze` en el constructor (inmutabilidad).
- Nunca expone el `string` crudo salvo por getter de solo lectura.
