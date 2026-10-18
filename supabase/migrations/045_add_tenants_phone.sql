-- 045_add_tenants_phone.sql
-- Añade phone del negocio al tenant para Slide 1/2 del wizard OMEGA (H-K K-5-bis).
-- Formato E.164 (coherente con la validación regex del frontend).
-- Idempotente (ADD COLUMN IF NOT EXISTS + DROP/ADD constraint). Aditiva. Zero data.
-- Sin BEGIN/COMMIT (lección 044: choca con el wrapper de `supabase db push`;
-- aplicar por SQL Editor).

ALTER TABLE public.tenants
  ADD COLUMN IF NOT EXISTS phone text;

ALTER TABLE public.tenants
  DROP CONSTRAINT IF EXISTS tenants_phone_e164_check;

ALTER TABLE public.tenants
  ADD CONSTRAINT tenants_phone_e164_check
  CHECK (phone IS NULL OR phone ~ '^\+[1-9]\d{6,14}$');

COMMENT ON COLUMN public.tenants.phone IS
  'Business phone E.164 (owner/billing/customer-facing). Verified via WhatsApp Business API en Sprint 5. NO es users.phone — esto es el teléfono del negocio, no de la persona.';
