# HUB — Método de Construcción

## Filosofía
ULTRA precisión sobre velocidad. Construir para durar años sin degradación.

## Ciclo por cada pieza
1. **Documentar primero** — cada archivo `.md` precede a su `.ts` espejo.
2. **Diseñar el contrato** — interfaz/type antes de implementar.
3. **Implementar puro** — dominio sin side-effects, testable sin mocks.
4. **Aislar side-effects** — solo en `infrastructure`.
5. **Verificar DoD** — ≤75 líneas, una responsabilidad, nombre canónico.

## Orden de capas
`shared-kernel → domain → application → infrastructure`.
Nunca se construye una capa superior sin su dependencia inferior.

## Regla de cambio
- Migración de schema: primero en `data-schema/`, luego producción.
- NUNCA PARCHAR: riesgo de regla → reestructura antes de continuar.

## Herramientas de verificación
- Lint de capas y gate de 75 líneas en CI.
- FORTRESS audita doc vs repo semanalmente.
