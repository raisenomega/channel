# Infraestructura — Adapter `OmegaAdapter` (Brand Voice)

## Propósito
Heredar la Brand Voice del negocio desde OMEGA (ecosistema Raisen).

## Responsabilidad
Implementar `OmegaGateway` (contrato de `application`).

## Detalles
- `obtenerBrandVoice(tenantId)` — cache 1h en Redis.
- Invalidación por evento `omega.brand_voice.updated`.
- Alimenta el system prompt del agente: tono, frases, prohibiciones, emojis locales.

## Separación de responsabilidades
- **OMEGA** aporta la **voz** (cómo se expresa el negocio).
- **Claude** aporta el **razonamiento** (qué decidir) — ver `claude.infrastructure.adapter.md`.
- El motor de decisión es HUB (`cognition/`); no delega la inferencia a OMEGA.
