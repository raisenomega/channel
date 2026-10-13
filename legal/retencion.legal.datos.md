# Legal — Política de Retención y Eliminación de Datos

## Plazos por tipo de dato
| Dato | Retención activa | Retención post-cancelación | Destino final |
|---|---|---|---|
| Mensajes de conversaciones | mientras el cliente sea activo | 30 días | borrado irreversible |
| Registros IA (`agent_interactions`) | mientras el cliente sea activo | 30 días | anonimizado → global knowledge |
| Knowledge base (`agent_knowledge`) | mientras el cliente sea activo | 30 días | borrado irreversible |
| Datos de contacto | mientras el cliente sea activo | 30 días | borrado irreversible |
| Logs de auditoría | 3 años (compliance) | 3 años | retenido, luego anonimizado |
| Logs de webhooks | 90 días | 90 días | borrado irreversible |

## Procedimiento de borrado
1. Día 0: desactivar cuenta, kill switch autonomía, notificar al cliente.
2. Día 1–30: ventana de exportación (el cliente descarga sus datos).
3. Día 31: `DELETE CASCADE` de todas las tablas del tenant.
4. Día 32: confirmación de borrado + certificado de destrucción.

## Excepción
Logs de auditoría se retienen 3 años por compliance (sin PII).