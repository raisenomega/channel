# Estándar Cero Tolerancia — Límite de 75 Líneas

## Regla
Ningún archivo excede **75 líneas**. Sin excepciones, sin excusas por complejidad.

## Cuándo extraer
Al acercarse a 75 líneas, extraer inmediatamente a archivos dedicados:
- Tipos/interfaces → `*.shared-kernel.tipos.ts`
- Validaciones → `*.domain.validacion.ts`
- Transformaciones → `*.application.transformacion.ts`
- Errores → `*.shared-kernel.errores.ts`
- Constantes → `*.shared-kernel.constantes.ts`

## Señales de alerta (refactor ya)
- Una función con más de una responsabilidad discernible.
- Un archivo que mezcla validación con persistencia.
- Un archivo que mezcla tipos con lógica de negocio.
- Más de un Aggregate/entidad exportado por archivo.

## Anti-patrones prohibidos
- Archivos de utilidades genéricos (`utils.ts`, `helpers.ts`, `misc.ts`).
- Fusionar responsabilidades para ahorrar archivos.
- Tratar la complejidad como excusa para romper la regla.
- `index.ts` con lógica (solo re-exporta, sin contenido).

## Métrica de control
- Línea 76 = señal de refactor **inmediato**, no diferido.
- El CI rechaza cualquier archivo > 75 líneas en el gate de lint.
