# Dominio — Value Object `ConversationStatus`

## Definición
```ts
export type ConversationStatus =
  | 'open'
  | 'pending'
  | 'resolved'
  | 'snoozed';
```

## Transiciones válidas
| De | A | Disparador |
|---|---|---|
| open | pending | SLA primera respuesta cumplida |
| open/pending | resolved | agente cierra |
| open | snoozed | agente pospone |
| snoozed | open | timer expira |
| resolved | open | contacto vuelve a escribir |

## Invariante
`resolved` es terminal salvo reapertura por mensaje entrante del contacto.

## Validación
`transicionar(actual, siguiente)` retorna `Result<void, StatusError>` y
rechaza transiciones ilegales (ej. `resolved → snoozed`).
