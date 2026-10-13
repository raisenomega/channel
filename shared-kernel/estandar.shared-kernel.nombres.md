# Estándar Cero Tolerancia — Convención de Nombres (A10)

## Regla
`{Contexto}.{tipo}.{ext}` — el nombre declara contexto y responsabilidad.

## Patrón de código (TypeScript)
- Archivo: `{Contexto}.{tipo}.ts`
- Ejemplos: `conversation.entity.ts`, `create-quote.command.ts`, `zernio.adapter.ts`
- Módulos en `apps/web/src/modules/{contexto}/` con las 4 capas dentro.

## Patrón de documentación (Markdown)
- Archivo: `{tema}.{capa}.{responsabilidad}.md` (espejo de la capa DDD)
- Ejemplos: `conversacion.domain.entidad.md`, `whatsapp.infrastructure.adapter.md`

## Tipos válidos (`{tipo}`)
- `domain`: `entity`, `value-object`, `aggregate`, `event`, `repository` (contrato)
- `application`: `command`, `query`, `handler`, `dto`
- `infrastructure`: `adapter`, `repository`, `mapper`, `gateway`
- `presentation`: `component`, `page`, `hook`, `layout`

## Regla
Prohibidos nombres genéricos (`utils`, `helper`, `misc`, `common`) con lógica.
Un nombre genérico indica responsabilidad difusa.
