-- ============================================================================
-- HUB by Raisen — Migración 034: Tenant branding (Slide 3.3 landing page)
--
-- Añade a `tenants`:
--   - slug: text UNIQUE NOT NULL (URL /pay/:slug/:orderId). Backfill desde name.
--   - branding_config: jsonb NOT NULL DEFAULT '{}' (logo_url + primary_color).
--
-- Idempotente: ADD COLUMN IF NOT EXISTS. Safe: backfill solo si slug nulo/vacío.
-- ============================================================================

-- Columna slug (ya puede existir si el BC identity la usa; asegura UNIQUE NOT NULL)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'tenants' AND column_name = 'slug'
  ) THEN
    ALTER TABLE public.tenants ADD COLUMN slug text;
  END IF;
END;
$$;

ALTER TABLE public.tenants ALTER COLUMN slug DROP NOT NULL;
-- Backfill: generar slug único desde name (slugs duplicados -> sufijo uuid corto)
WITH t AS (
  SELECT id,
         lower(regexp_replace(name, '[^a-zA-Z0-9]+', '-', 'g')) AS base,
         row_number() OVER (PARTITION BY lower(regexp_replace(name, '[^a-zA-Z0-9]+', '-', 'g')) ORDER BY created_at) AS rn
  FROM public.tenants
  WHERE slug IS NULL OR slug = ''
)
UPDATE public.tenants SET slug = CASE WHEN t.rn = 1 THEN t.base ELSE t.base || '-' || substring(gen_random_uuid()::text, 1, 6) END
FROM t WHERE public.tenants.id = t.id;

-- Índice único y NOT NULL final
CREATE UNIQUE INDEX IF NOT EXISTS idx_tenants_slug_unique ON public.tenants(slug);
ALTER TABLE public.tenants ALTER COLUMN slug SET NOT NULL;

-- Columna branding_config
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'tenants' AND column_name = 'branding_config'
  ) THEN
    ALTER TABLE public.tenants ADD COLUMN branding_config jsonb NOT NULL DEFAULT '{}'::jsonb;
  END IF;
END;
$$;

COMMENT ON COLUMN public.tenants.slug IS 'Slug único para la landing pública /pay/:slug/:orderId.';
COMMENT ON COLUMN public.tenants.branding_config IS 'JSONB con logo_url y primary_color para personalizar la landing de cobro.';

-- ============================================================================
-- FIN Migración 034
-- ============================================================================