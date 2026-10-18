-- 049_add_tenants_zernio_profile_id.sql — HOTFIX O (O-5). Aplicar por SQL Editor.
-- Aislamiento multi-tenant del OAuth de canales Meta via Zernio: cada tenant tiene su
-- profile Zernio. El callback valida que el profileId del retorno == tenant.zernio_profile_id.
-- Idempotente (IF NOT EXISTS). Sin BEGIN/COMMIT (leccion 044).

ALTER TABLE public.tenants
  ADD COLUMN IF NOT EXISTS zernio_profile_id text;

CREATE INDEX IF NOT EXISTS tenants_zernio_profile_id_idx
  ON public.tenants(zernio_profile_id)
  WHERE zernio_profile_id IS NOT NULL;

COMMENT ON COLUMN public.tenants.zernio_profile_id IS
  'Zernio profile ID per-tenant (aislamiento multi-tenant OAuth channels Meta). Set by zernioProfileService.ensureProfileForTenant (O-6).';
