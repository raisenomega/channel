# Dominio — Value Object `Money`

## Responsabilidad
Monto + moneda. Prohíbe aritmética sobre `number` flotante suelto.

## Implementación
```ts
export interface Money {
  readonly amount: number;   // en centavos (entero)
  readonly currency: string; // ISO 4217
}

export const crearMoney = (monto: number, moneda: string): Result<Money, MoneyError> => {
  if (!Number.isInteger(monto)) return err({ kind: 'non_integer_amount' });
  if (monto < 0) return err({ kind: 'negative_amount' });
  return ok(Object.freeze({ amount: monto, currency: moneda.toUpperCase() }));
};
```

## Reglas
- Cantidad en centavos (entero), nunca decimal binario.
- Moneda ISO 4217 en mayúsculas.
- Comparaciones y sumas vía helpers dedicados, no operadores directos.
