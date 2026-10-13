# Dominio — Entidad `AgentKnowledge`

## Responsabilidad
Hechos aprendidos por tenant, en 9 categorías.

## Categorías (9)
1. `rule` — "siempre usar plantilla X para tipo Y de consulta"
2. `preference` — "este negocio prefiere responder emails en la mañana"
3. `pattern` — "los viernes hay picos de consultas de horario"
4. `correction` — "no confundir 'Servicios' con 'Mantenimiento'"
5. `context` — "negocio de limpieza, opera Bayamón y Guaynabo"
6. `brand_voice` — fragmento de Brand Voice específico
7. `catalog` — "el producto X cuesta $Y con IVU aplicado"
8. `escalation` — "cliente Juan Pérez siempre pide hablar con el dueño"
9. `benchmark` — "tiempo promedio de la industria: 15 min"

## Campos de atención (confidence)
- `confidence` (0–1), `times_applied`, `times_confirmed`, `times_corrected`.
- `source` ∈ interaction / pattern / manual / onboarding / vertical / global / brand_voice.
- `status` ∈ active / archived / superseded / deleted.

## Regla
`brand_voice` proviene de OMEGA y se cachea 1h.
