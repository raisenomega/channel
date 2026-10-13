# HUB — Regla de Confidencialidad (NO COMMITEAR, NO PUSH)

## Regla heredada de NÚCLEO
Ningún documento fundamental de HUB se commitea ni se hace push. Jamás.

## Alcance
Todo documento fundamental, técnico, de stack, o que revele funciones, acciones,
lógica o estrategia de HUB es propiedad intelectual de raisen.agency y vive solo en local.

## Entra en `.gitignore`
`/docs-hub/`, `master_hub.md`, `SOURCE_OF_TRUTH_HUB.md`, `metodo-hub.md`,
`PRD_hub.md`, `AGENTE-IA-HUB.md`, `DDD-CERO-TOLERANCIA-HUB.md`, `ARQUITECTURA-*`,
`*.hub.md`, `CLAUDE.md`, `.claude/`.

## Excepción
El código de runtime (invariants, tokens de tema, adapters) SÍ se commitea —
es código, no documento — pero **sin comentarios que expliquen estrategia**.

## Razón
El repo remoto (`github.com/raisenomega/hub`) contiene solo el código de la
aplicación; nunca los planos. Estar en `.gitignore` no impide que Claude Code
ni el equipo los usen localmente; impide que salgan del equipo.
