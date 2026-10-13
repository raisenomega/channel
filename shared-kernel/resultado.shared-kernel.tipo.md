# Shared Kernel — Tipo `Result`

## Propósito
Representar éxito o fallo sin excepciones de dominio. Todo VO/Entity autovalidado retorna `Result`.

## Definición (TypeScript estricto)
```ts
export type Result<T, E> = Ok<T> | Err<E>;

export interface Ok<T> {
  readonly ok: true;
  readonly value: T;
}

export interface Err<E> {
  readonly ok: false;
  readonly error: E;
}

export const ok = <T>(value: T): Ok<T> => ({ ok: true, value });
export const err = <E>(error: E): Err<E> => ({ ok: false, error });
```

## Reglas de uso
- `T` y `E` siempre tipados explícitamente (nunca `any`/`unknown` sin narrowing).
- El error es un Value Object o union discriminada, no un `string` suelto.
- El dominio nunca lanza excepciones para flujo de negocio; retorna `Result`.

## Narrowing obligatorio
```ts
const r = Email.crear("x@y.com");
if (r.ok) {
  const email: Email = r.value; // estrechado por discriminante
} else {
  const motivo: EmailError = r.error; // union discriminada
}
```

## Inmutabilidad
`Ok` y `Err` son `readonly`; los valores se congelan con `Object.freeze`
en el constructor del VO para impedir mutación posterior.
