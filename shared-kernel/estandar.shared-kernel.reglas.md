# Estándar Cero Tolerancia — Reglas No Negociables

> Gobernanza absoluta de HUB. Ninguna regla admite excepción, atajo o parche.

## Reglas (11)
1. **Separación de Preocupaciones** — rigurosa en cada capa.
2. **DRY** — cero duplicación de lógica.
3. **Responsabilidad Única** — por archivo y por función.
4. **TypeScript Estricto** — prohibido `any`, `as any`, `unknown` sin narrowing.
5. **Código Real** — sin relleno; solo implementaciones listas para producción.
6. **Estado Inmutable** — `Readonly` + `Object.freeze`; toda actualización es funcional.
7. **Aislamiento de Efectos Secundarios** — exclusivo en adaptadores de infraestructura.
8. **Capa de Dominio Pura** — cero dependencias externas; VO/Entity/Aggregate puros y autovalidados.
9. **Result Pattern** — errores tipados; el dominio no lanza excepciones de negocio.
10. **CQRS** — un Command/Query Handler = exactamente un caso de uso.
11. **NUNCA PARCHAR** — si una regla está en riesgo, detente y reestructura.

## Regla transversal: 75 líneas
- Ningún archivo excede 75 líneas, sin excepciones.
- Al acercarse a 75, extraer tipos/validaciones/transformaciones/errores/constantes.
- Detalle: `estandar.shared-kernel.lineas.md`

## Consecuencia de incumplimiento
Todo archivo que vulnere una regla queda **bloqueado para merge** hasta reestructurarse.
