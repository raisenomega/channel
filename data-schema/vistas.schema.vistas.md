# Data Schema — Vistas

## `v_inbox_conversations`
Vista principal del inbox unificado.
Columnas clave: conversation_id, contact_display_name, channel_type,
last_message_body, last_message_at, assigned_agent, tags, status.

## `v_ai_performance_daily`
Performance del agente IA por día.
Columnas clave: tenant_id, fecha, interacciones, was_correct_rate,
avg_confidence, indistinguishability_score, costo, latencia_media.

## `v_contact_360`
Vista consolidada de un contacto.
Agrega: conversaciones + cotizaciones + órdenes + pagos + interacciones IA
en una sola lectura.

## Regla
Las vistas son de solo lectura y respetan RLS del tenant (`security_invoker`).
