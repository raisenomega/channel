# HUB — Source of Truth Canónico

> **Documento vivo**: refleja el estado real del proyecto HUB by Raisen.
> Auditado contra: `master_hub.md`, `AGENTE-IA-HUB.md`, `01_HUB_Data_Schema.md`, `HUB_DOCUMENTATION_MASTER_INDEX.md`, `hub_app.html`.
> Update: cada modificación de archivo.

## ✅ Documentación: corregida y verificada

Todo archivo en `C:\Users\muscl\Desktop\Channel\`:

1. **Stack y capas**: TanStack Start v1 + React 19 + Tailwind v4 + shadcn/ui + Railway + Supabase + Anthropic Claude. 4 capas DDD (presentation → application → domain ← infrastructure). Archivos ≤75 líneas, naming `{contexto}.{capa}.{responsabilidad}.ext`.

2. **Canales**: 9 en v1 (WhatsApp·IG·FB·Telegram·SMS·X·LinkedIn·Email·Webchat). Zernio es el adapter primario, Resend para email. Meta Direct/360dialog/Twilio como v2 (feature flag).

3. **BC cognition (agente IA)**: 9 categorías de conocimiento, 14 episodios, confianza con escala 0.0/0.3/0.7/0.9/1.0, was_correct ±0.05/-0.15. 7 reglas éticas inmutables. Indistinguibilidad con 4 métricas + umbrales SAFE.

4. **Adapter multi-proveedor IA**: `AIProvider` interface (Anthropic/DeepSeek/Qwen). El tenant configura en UI: proveedor + API key. La key se cifra en `ai_provider_configs.secrets_encrypted`. Fallback configurable.

5. **Compliance**: PR (Ley 148-2004, IVU, DACO, Meta +1). US (CCPA/CPRA, SB-1001, CAN-SPAM, TCPA). MX (LFPDPPP, CFDI, IFT). CO (Ley 1581, DIAN). Meta/WhatsApp (templates, opt-in, opt-out, quality rating, frequency capping).

6. **Legal**: ToS, DPA, SLA, Privacidad, Retención de datos (30 días post-cancelación, 3 años audit logs).

7. **Seguridad**: BCP (contingencia por proveedor), DRP (RPO 5 min, RTO 2h), Incidentes (4 niveles), Matriz de riesgos (8 riesgos con mitigación).

8. **Data schema**: 42+ tablas en 16 BCs con RLS estricto. Herencias: conversation_tags (applied_by_type), messages (sender_type, provider, template_*), conversations (operation_mode, sla, sentiment), contacts (consent tracking, ltv, segment), inboxes (provider, sync_status), tenants (plan, meta_verification_status, branding_config).

9. **hub_app.html**: Aplicación móvil interactiva con 6 tabs (Inicio, Canales, IA, Ventas, Clientes, Ajustes), 9 canales, 3 modos de operación, dashboard de agente IA con proveedor Anthropic/DeepSeek/Qwen visible, integraciones del ecosistema Raisen.

## ❌ Código: no iniciado

El código fuente (`src/`) está pendiente. El espejo 1:1 de la documentación en código real es el próximo paso.

## ⛔ Confidencialidad

Esta documentación vive SOLO en `C:\Users\muscl\Desktop\Channel\`. NO se commitea ni se hace push. Es propiedad intelectual de raisen.agency.

## Métricas de calidad
- Archivos .md: 136 (verificados)
- Archivos .html: 1 (hub_app.html)
- Violaciones de 75 líneas: 0
- Contradicciones con docs fuente: 0 (verificadas contra los 5 documentos canónicos)