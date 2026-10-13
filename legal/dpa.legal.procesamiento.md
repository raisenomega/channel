# Legal — Acuerdo de Procesamiento de Datos (DPA)

## Partes
Raisen.agency (procesador) ↔ Cliente (responsable del tratamiento).

## Alcance
Datos tratados por HUB: mensajes de conversaciones, datos de contacto,
registros de interacciones IA, knowledge base del tenant, metadatos de canal.

## Sub-procesadores autorizados
| Sub-procesador | Función | Jurisdicción |
|---|---|---|
| Zernio | Enrutamiento de canales (WA/IG/FB/TG/SMS/X/LI) | US |
| Resend | Envío/recepción de email | US |
| Anthropic | Procesamiento LLM (modo autónomo) | US |
| Supabase | Almacenamiento PostgreSQL + Storage | US (multi-región) |
| Railway | Compute (workers, cron, webhooks) | US |
| Stripe / ATH Móvil | Procesamiento de pagos | US / PR |

## Obligaciones
- Notificar al cliente en caso de breach de datos en ≤72h.
- No usar datos del cliente para entrenar modelos cross-tenant sin anonimización.
- Eliminar datos del cliente en ≤30 días tras cancelación.