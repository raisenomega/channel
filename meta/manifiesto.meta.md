# HUB — Manifiesto en el Ecosistema Raisen

## Posición
HUB es la **plataforma 12** del ecosistema RAISEN.dev: la capa comunicacional
con opción de autonomía completa.

## Rol de las plataformas hermanas
| Plataforma | Rol | Integración HUB |
|---|---|---|
| NÚCLEO | ERP + CRM maestro | ficha, facturas, cotizaciones fiscales |
| OMEGA | Marketing IA + Brand Voice | voz del agente |
| POS | Transacciones | recibos digitales, devoluciones |
| TABLE / HEALTH / HOME / FLEET | Verticales | reservas, citas, mantenimiento, entregas |
| SAFE | Gobernanza IA | evalúa cada respuesta autónoma |
| FORTRESS | Auditoría de código | audita el BC `cognition/` |

## Principio de composición
HUB no reimplementa NÚCLEO ni OMEGA; los **integra** vía adapters + Supabase
Realtime. Los IDs externos (`nucleo_*`, `omega_*`, `pos_*`) son el pegamento.

## Foso irreplicable
Ningún competidor puede demostrar que sus agentes IA están gobernados con el
mismo estándar que Raisen le vende al mundo (SAFE + indistinguibilidad).
