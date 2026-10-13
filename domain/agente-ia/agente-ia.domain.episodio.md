# Dominio — Episodios Conversacionales

## Responsabilidad
14 patrones reutilizables que el agente reconoce y ejecuta.

## Lista (14)
`initial_contact`, `quote_negotiation`, `order_processing`, `complaint_resolution`,
`reservation_booking`, `delivery_tracking`, `support_ticket`, `upsell_cross_sell`,
`churn_prevention`, `retention_success`, `onboarding_customer`, `lost_customer`,
`human_escalation`, `custom`.

## Reglas por episodio
- `complaint_resolution` → escalar siempre (regla inmutable).
- `human_escalation` → la IA escaló a humano.
- `quote_negotiation` → puede usar Quotes con confianza mínima.

## Campos clave
`input_state`, `output_state`, `actions_taken`, `outcome`
(success / partial / failure / escalated), `was_autonomous`,
`human_intervention_count`, `lessons_learned`.
