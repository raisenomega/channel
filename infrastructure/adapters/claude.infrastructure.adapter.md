# Infraestructura — Adapter `ClaudeAdapter` (LLM)

## Proveedor
Anthropic Claude — LLM oficial (mismo proveedor que NÚCLEO). Modelo `claude-sonnet-4-6`.

## Responsabilidad
Implementar el contrato `AIProvider` del BC `cognition/` (heredado de NÚCLEO).

## Detalles
- `completar(systemPrompt, messages, tools)` → respuesta + tokens + latencia + costo.
- Registra `tokens_input`, `tokens_output`, `latency_ms`, `cost_usd`.
- Proveedor secundario configurable (regla P3: requiere autorización del owner).

## Costo
~$0.003 por interacción promedio (2–3K tokens). Pass-through al cliente.

## Regla
Solo `infrastructure` conoce el SDK de Anthropic. `domain` nunca lo importa (A2).
