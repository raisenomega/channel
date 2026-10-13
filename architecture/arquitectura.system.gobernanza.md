# Arquitectura — Gobernanza del Sistema

## Principio
ULTRA precisión sobre velocidad. El sistema se construye para durar años.

## Mecanismos de gobierno
1. **Lint de capas** — CI rechaza imports que cruzan fronteras DDD.
2. **Gate de 75 líneas** — CI rechaza archivos > 75 líneas.
3. **FORTRESS** — auditoría semanal de doc vs repo real.
4. **Changelog maestro** — todo cambio estructural queda registrado.
5. **Source of Truth** — único reflejo del estado real (no aspiracional).

## Regla de cambio
- Migración de schema: primero en `data-schema/`, luego en producción.
- Reglas críticas (RLS, capas, 75 líneas) requieren revisión del owner.
- NUNCA PARCHAR: si una regla está en riesgo, se reestructura antes de continuar.

## Métricas de salud (trimestral)
- Cero archivos > 75 líneas.
- Cero violaciones de capa.
- 100 % de tablas con RLS activo.
- Cobertura de tests del dominio > 90 %.
