# Auditoría S1–S5 — HUB by Raisen

> **Fecha:** 2026-10-13
> **Alcance:** Verificación del código real contra el checklist del Plan Maestro (§2.1–2.5)
> **Método:** Gates ejecutados directamente (`tsc`, `eslint`), conteo C4, greps de capas/`any`/RLS, cruce de tests, revisión del Source of Truth y GO_PRODUCTION.
> **Regla de decisión:** 1 fallo bloquea el cierre de sesión / el merge (§5, S3).

---

## Resultado global

**Apto con reservas → NO CERRAR la sesión hasta resolver las 3 violaciones críticas (C4, capas, S1) y registrar deuda de tests/seguridad.**

| Chequeo | Regla | Estado | Evidencia |
|---------|-------|--------|-----------|
| `tsc --noEmit` | C3 | ✅ **OK** | 0 errores |
| Cero `any` | C1 | ✅ **OK** | 0 coincidencias en `src/` |
| Cero `@ts-ignore`/`@ts-expect` | C2 | ✅ **OK** | 0 coincidencias en `src/` |
| Archivos ≤75 líneas (backend) | C4 | ❌ **FALLO (6)** | ver §1 |
| domain sin imports de infra/proveedores | A2 | ✅ **OK** | 0; único `@supabase` en `shared/infrastructure` |
| Capas DDD (app no depende de infra) | A1/A8/A9 | ❌ **FALLO (2)** | ver §2 |
| lint sin errores | C3 | ✅ OK (0 errors) | 51 warnings (deuda, §2.5 parcial) |
| Toda tabla de clientes con tenant_id + RLS | N3 | ✅ **OK** | 45 tablas ENABLE RLS, 51 policies |
| Secretos cifrados | N4 | ⚠️ **PARCIAL** | ver §3 |
| Todo handler app con test unitario | §2.3 | ❌ **FALLO parcial** | ver §4 |
| Source of Truth refleja estado real | S1 | ❌ **FALLO** | ver §5 |
| Commits `[FASE_N]` descriptivos | S4 | ✅ **OK** | ver §6 |

---

## §1 — C4: archivos backend que superan 75 líneas (6 violaciones)

| Archivo | Líneas | Nota |
|---------|--------|------|
| `src/cognition/safe/safe-evaluator.ts` | **84** | excede 9 líneas |
| `src/cognition/safe/safe-governance.entity.ts` | **83** | excede 8 líneas |
| `src/compliance/domain/compliance.entity.ts` | **79** | excede 4 líneas |
| `src/inbox/domain/conversation.entity.ts` | **77** | excede 2 líneas |
| `src/integrations/infrastructure/vertical-adapters.ts` | **76** | excede 1 línea |
| `src/contacts/domain/contact.entity.ts` | **76** | excede 1 línea |

> El Source of Truth declara "C4: 0 violaciones" — **esto es incorrecto**, la verificación real muestra 6.

---

## §2 — Capas DDD: application que depende de infrastructure (2 violaciones)

1. **`src/compliance/application/audit-logger.ts:54`**
   - Importa `supabase` de `shared/infrastructure` **a mitad del archivo** (tras el código).
   - `DataExportService` y `DataCleanupService` (application) acceden a Supabase **directamente**, saltándose la interfaz `AuditRepository` que sí existe en `domain/compliance.repository.ts` (importada pero no usada por esas clases).
   - **Fix sugerido:** inyectar repositorios vía constructor (DI), no importar `supabase`.

2. **`src/cognition/application/prompt-builder.ts:3`**
   - Importa `AIProviderRegistry` desde `../infrastructure/ai-provider.registry.ts` en una función de application.
   - **Fix sugerido:** definir la interfaz `AIProviderRegistry` en `domain/` (junto a `AIProvider`) y dejar solo la implementación en infrastructure; `completarConProvider` debe recibir el registry inyectado.
   - Menor: `m.role as MessageRole` (línea 42) es un cast de narrowing sin validación.

> A excepción de estos dos, NO hay archivos de `domain/` importando de `infrastructure/` ✔. La regla estructural de dependencias está en general bien respetada.

---

## §3 — N4: manejo de secretos (parcial)

- ⚠️ **`webhook_provider_configs.secret` y `.public_key`** (`004_channels.sql:41-42`) se definen como `text` **sin cifrado**. Viola N4 ("secretos nunca en texto plano").
- ✅ `ai_provider_configs.secrets_encrypted` (`016_cognition_graph_ai.sql:56`) es `jsonb` nominalmente cifrado — OK por diseño, depende de que el backend cifre al insertar.
- ✅ `pgcrypto` habilitado en `001_initial.sql:7`.

---

## §4 — §2.3 Cobertura de tests de application handlers

**21 tests unitarios + 1 test de integración (`tests/integration/identity/`) existentes.**
Cubren ~6 handlers directamente. **Sin test unitario (15 handlers de application):**

- `automation/canned-response`
- `automation/evaluate-rules`
- `channels/process-webhook`
- `cognition/decide-response`
- `cognition/post-envio-eval`
- `commerce/create-quote`
- `commerce/process-payment`
- `compliance/opt-in`
- `contacts/create-contact`
- `identity/create-user`
- `inbox/assign-conversation`
- `inbox/receive-message`
- `inbox/send-message`
- `integrations/sync-from-nucleo`
- `integrations/sync-to-nucleo`

> La mayoría de los tests existentes cubren **entidades/VO** (10 de 21). Solo 6 handlers tienen test directo. **Brecha real de cobertura.**

---

## §5 — S1: el Source of Truth NO refleja el estado real (crítico)

Discrepancias verificadas entre `meta/source-of-truth.meta.md`, `GO_PRODUCTION.md` y el sistema de archivos:

| Declaración (SoT) | Realidad verificada |
|-------------------|---------------------|
| "C4: 0 violaciones" | **6 archivos >75 líneas** |
| "17 migraciones" | **22 migraciones** (001-023 reales) |
| "18 tests" | **21 tests** unitarios |
| "FASE D/E bloqueada" (GO_PRODUCTION) | Registro/onboarding **resuelto** (ver flujo funcional) |
| "101 archivos TS" | conteo actual difiere (frontend ++) |
| Numeración migraciones "012-017" | archivos con sufijos nums `015_cognition_core`… no `012-013` |

**Impacto:** S1 falla; no se puede usar el SoT como punto de arranque confiable de la siguiente sesión. **Debe actualizarse.**

---

## §6 — S4: commits (OK)

Los mensajes cumplen el formato `[FASE_N] Descripción`. Ejemplos recientes:

```
4b5902a [FASE_D][UI] Toggles ES/EN y tema oscuro/claro + fix build Vercel
8cd6714 [FASE_D] Cablear navegacion del shell
40da1db [FASE_D] Fix flujo auth: token invalido -> cierra sesion
ff40d5f [FASE_G] Integration tests identity
```

Nota: no llevan `Refs: #issue`, pero son descriptivos (requisito principal de S4 cumplido).

---

## Checklist por regla (resumen ejecutivo)

- [x] C1 cero `any`
- [x] C2 cero `@ts-ignore`
- [x] C3 `tsc --noEmit` 0 errores / lint 0 errors (**51 warnings pendientes**)
- [x] N3 RLS + tenant_id en todas las tablas de datos
- [x] A2 domain limpio de imports externos
- [ ] **C4 6 archivos >75 líneas**
- [ ] **A1/A8/A9 2 archivos application→infrastructure**
- [ ] **S1 Source of Truth desactualizado/incorrecto**
- [ ] **§2.3 15 handlers sin test**
- [ ] **N4 `webhook_provider_configs.secret` en texto plano**
- [ ] **§2.5 51 warnings de linter**

---

## Acción recomendada (no bloquea el roadmap, pero sí el cierre de sesión)

1. **S1 (prioridad):** actualizar `source-of-truth.meta.md` con el estado real (22 migraciones, 21 tests, 6 fallos C4, frontend desplegado). `GO_PRODUCTION.md` y SoT deben ser coherentes.
2. **C4:** extraer tipos/validaciones/constantes en los 6 archivos para ≤75 líneas.
3. **Capas:** mover la interfaz `AIProviderRegistry` a domain e inyectar repositorios en `audit-logger`.
4. **N4:** cifrar `webhook_provider_configs.secret` con `pgp_sym_encrypt` / pgsodium (Vault) y descifrar solo en infra.
5. **Tests:** añadir unit para los 15 handlers críticos (al menos los de inbox, cognition, commerce, compliance).
6. **Lint:** limpiar los 51 `no-unused-vars` (imports muertos).