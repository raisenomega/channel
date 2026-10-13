# Seguridad — Plan de Recuperación ante Desastres (DRP)

## RPO / RTO
| Componente | RPO (pérdida max) | RTO (recuperación max) |
|---|---|---|
| Base de datos (Supabase) | 5 minutos (WAL) | 2 horas |
| Archivos (Supabase Storage) | 1 hora (snapshot) | 4 horas |
| Código (GitHub) | 1 commit | 30 minutos |
| Config de Railway | 1 despliegue | 1 hora |

## Procedimiento
1. **Detección** — alerta de uptime (< 99.5 %) + Sentry + PostHog.
2. **Evaluación** — determinar si es fallo de infraestructura o de proveedor externo.
3. **Recuperación**:
   - Supabase: point-in-time recovery a 5 minutos antes del desastre.
   - Railway: redeploy desde última versión estable en GitHub.
   - Storage: restore desde snapshot S3.
4. **Post-mortem** — informe en ≤ 48h, registrado en SOURCE_OF_TRUTH_HUB.md.

## Pruebas
- Failover simulado: trimestral.
- Restore de backup: semestral.