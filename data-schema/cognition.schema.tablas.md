# Data Schema — Cognición (Agente IA)

> Definición completa en `domain/agente-ia/`. Aquí solo el contrato de tablas.

## Tablas (8)
| Tabla | Propósito | Particionada |
|---|---|---|
| agent_interactions | Cada interacción del agente (input/acción/resultado) | ✅ mensual |
| agent_knowledge | Conocimiento por tenant (9 categorías, incl. brand_voice) | — |
| agent_episodes | 14 tipos de episodios conversacionales | — |
| agent_global_knowledge | Conocimiento cross-tenant anonimizado (global) | — |
| agent_vertical_templates | Templates por vertical (global) | — |
| agent_graph_memory | Memoria de grafo con `pgvector` | — |
| agent_graph_edges | Aristas del grafo de memoria | — |
| agent_autonomy_config | Autonomía granular por canal/horario | — |

## Campos transversales obligatorios
- `tenant_id` (excepto las 2 globales).
- `ai_confidence real`, `ai_mode enum` donde aplique.
- `created_at timestamptz DEFAULT NOW()`.

## RLS
Globales: solo lectura para tenants. Resto: `tenant_isolation_*`.
