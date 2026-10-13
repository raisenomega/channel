# HUB — Protocolo de Auditoría Grado Bancario (P1 Duro)

> **Regla ley, no negociable.** Se ejecuta SIEMPRE antes de cerrar una sesión
> y de iniciar la siguiente (cada sesión / fase / implementación). Si no pasa
> el 100%, NO se cierra la sesión actual ni se inicia la siguiente. Cero
> excepciones, cero atajos, cero parches.
>
> Jerarquía: P1 (La Verdad Bruta) → una cosa no se da por terminada hasta
> verificar que funciona, y si no se sabe, se dice "no sé".

## 1. Cuándo se ejecuta (obligatorio)

- [ ] Al CERRAR cada sesión (antes del commit de cierre / merge).
- [ ] Antes de INICIAR cada nueva sesión, fase o implementación.
- [ ] Después de cada deploy a producción (verificación de regresión).
- [ ] Tras tocar migraciones de schema (inmutabilidad + rollback).

Si NO se ejecutó y pasó, la sesión NO cuenta como cerrada y se revierte el
estado de "hecho".

## 2. Verificación automática (gates ejecutables)

Correr en la raíz del repo:

```bash
# Meta-gate existente: líneas (C4) + capas (A2/C1/C2) + typecheck (C3) + lint
bash scripts/check-all.sh

# Individual, reproducible:
pnpm typecheck       # C3: strict, 0 errores
pnpm lint            # ESLint: 0 errores (front y back)
bash scripts/check-lines.sh    # C4: ninguno >75 líneas (back gated)
bash scripts/check-layers.sh   # A2/C1/C2: capas DDD puras
bash scripts/check-emojis.sh   # E0: cero emojis en fuente
```

El back `src/` está gated por CI; el front `apps/web/` se audita con los
mismos criterios (typecheck + lint) aunque el CI no lo obligue — para HUB,
el front y el back tienen el mismo estándar bancario.

## 3. Checklist de auditoría de código (verificación)

Cada archivo nuevo/cambiado DEBE cumplir todo:

| # | Regla | Verificación |
|---|-------|--------------|
| C1 | Cero `any` | `grep '\bany\b'` sin excepción salvo el tipo `Result<T,E>`. |
| C2 | Cero `@ts-ignore`/`@ts-expect` | `grep '@ts-(ignore\|expect)'` = 0. |
| C3 | TypeScript strict | `tsc --noEmit` 0 errores (back y front). |
| C4 | ≤75 líneas | Ningún `.ts` >75 (back gated; front igual estándar). |
| A5 | Result pattern | `domain/` retorna `Result<T,E>`; no lanza excepciones de negocio. |
| A10 | Naming `{Contexto}.{tipo}.ts` | Sin `utils/helper/misc/common` con lógica. |
| A2 | domain puro | `domain/` no importa de `infrastructure/`. |
| A8/A9 | Mappers/repos en infra | Mappers solo en `infrastructure/`; interfaces en `domain/`. |

## 4. Checklist de datos y seguridad

| # | Regla | Verificación |
|---|-------|--------------|
| N1/N3 | RLS por tenant | Toda tabla de datos tiene `tenant_id` + policy RLS + `ENABLE ROW LEVEL SECURITY`. |
| N4 | Secretos cifrados | Nunca en texto plano (pgcrypto/pgsodium). |
| N5 | Prohibido mock/seed ficticio | Cero `seed.sql`, cero placeholders con aspecto de persona real. El estado vacío es honesto (P1). |
| SEG | Webhooks con firma | Verificación de firma antes de procesar; no aceptar el payload sin validar. |

## 5. Checklist funcional y de producto

| # | Regla | Verificación |
|---|-------|--------------|
| P1 | Honestidad | Lo que no funciona se reporta; el estado vacío NO se rellena con datos falsos. |
| HP1 | WhatsApp-first | WhatsApp es canal primario de la experiencia. |
| HP2 | Conversación-transacción | El flujo muestra el ciclo comercial del contacto. |
| HP4 | Cero fricción | Ficha 360 del contacto sin salir de pantalla. |
| i18n | ES/EN completo | Toda cadena nueva existe en `ES` y `EN`; `t()` nunca devuelve la clave. |
| Navegación | Acciones reales | Los botones/acciones no son no-op ni lanzan excepción. |

## 6. Check de no-regresión y despliegue

- [ ] Back + front: typecheck y lint en 0 después del cambio.
- [ ] Ejecutar `vercel --prod` y verificar estado `● Ready` en el alias de producción.
- [ ] Confirmar que la URL de producción sirve el build nuevo (hard-refresh sin caché).
- [ ] Registro en `meta/changelog.meta.md` y `meta/source-of-truth.meta.md`.

## 7. Resultado

- **PASA (100%):** se cierra la sesión/implementación y se autoriza iniciar la siguiente.
- **FALLA (cualquier item en rojo):** la sesión queda abierta. Se abre una issue de
  deuda técnica, se corrige SIN parches, se re-ejecuta el protocolo, y solo entonces
  se reanuda. Violar este protocolo es motivo de post-mortem.

## 8. Fuente

- Plan Maestro §2 (Checklist de Auditoría), §5 (Regla de Cambio y Post-Mortem).
- `shared-kernel/` (reglas, capas, Result, líneas, nombres).
- `product/prd.product.principios.md` (P1–P5, HP1–HP6).
- `product/prd.product.requisitos-no-funcionales.md` (NFR/seguridad).

---

*Documento canónico del protocolo de auditoría grado bancario. Vigente desde 2026-10-13.*