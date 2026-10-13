# Seguridad — Matriz de Riesgos Operativos

## Riesgos
| Riesgo | Probabilidad | Impacto | Mitigación |
|---|---|---|---|
| Prompt injection en el agente IA | Media | Alto | Sanitización + SAFE pre-envío |
| Filtración de datos cross-tenant | Baja | Crítico | RLS estricto + auditoría FORTRESS |
| API key de proveedor IA expuesta | Baja | Alto | Secreto cifrado (pgcrypto), rotación trimestral |
| Dependencia de un solo proveedor LLM | Media | Alto | Multi-provider AI (Anthropic/DeepSeek/Qwen) |
| Caída de Zernio (canales caídos) | Media | Alto | Feature flags a Meta Direct/Twilio directo |
| Deriva del agente IA (quality decay) | Media | Medio | Auto-regeneración semanal + SAFE sampling 10 % |
| Incumplimiento de compliance local | Media | Alto | Docs de compliance + motor fiscal NÚCLEO |
| Pérdida de datos por error humano | Baja | Alto | WAL (RPO 5 min) + snapshot diario