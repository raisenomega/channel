# Compliance — US Federal + California

## Leyes aplicables
- **CCPA/CPRA** — privacidad de consumidores de California (opt-out de venta de datos).
- **SB-1001 (California)** — prohibido engañar con bots: disclosure obligatorio.
- **CAN-SPAM** — email comercial: opt-out y datos del remitente en cada envío.
- **TCPA** — SMS/llamadas: consentimiento previo expreso.
- **HIPAA** — datos de salud: NO cumplido en v1 (fuera de alcance).

## Disclosure de IA (SB-1001)
HUB añade disclaimer configurable si el contacto está en California o pregunta
"¿eres un bot?". Ver `product/prd.product.principios.md` (excepción legal de HP6).

## Consentimiento
- SMS: opt-in expreso antes de enviar (TCPA).
- Email: opt-out en cada mensaje (CAN-SPAM).
- Datos: derecho de acceso/borrado (CCPA).

## Riesgo y mitigación
| Riesgo | Mitigación |
|---|---|
| Sanción TCPA por SMS sin consentimiento | Flujo de opt-in antes de SMS |
| Multa SB-1001 por bot no revelado | Disclaimer configurable + detección de jurisdicción |
