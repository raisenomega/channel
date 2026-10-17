-- ============================================================================
-- HUB by Raisen — Migración 042: seed 6 personas canónicas (Hotfix K-7).
-- Idempotente: cada INSERT tiene WHERE NOT EXISTS por name.
-- La tabla personas se creó en 035-bis (Hotfix I). Este seed es canónico.
-- ============================================================================

INSERT INTO public.personas (name, role, default_for)
SELECT 'victor', 'ceo', '{}'::text[]
WHERE NOT EXISTS (SELECT 1 FROM public.personas WHERE name = 'victor');

INSERT INTO public.personas (name, role, default_for)
SELECT 'zahra', 'ventas', '{whatsapp, instagram, facebook}'
WHERE NOT EXISTS (SELECT 1 FROM public.personas WHERE name = 'zahra');

INSERT INTO public.personas (name, role, default_for)
SELECT 'iris', 'analisis', '{}'::text[]
WHERE NOT EXISTS (SELECT 1 FROM public.personas WHERE name = 'iris');

INSERT INTO public.personas (name, role, default_for)
SELECT 'eco', 'encuestas', '{whatsapp, instagram}'
WHERE NOT EXISTS (SELECT 1 FROM public.personas WHERE name = 'eco');

INSERT INTO public.personas (name, role, default_for)
SELECT 'angel', 'crisis', '{}'::text[]
WHERE NOT EXISTS (SELECT 1 FROM public.personas WHERE name = 'angel');

INSERT INTO public.personas (name, role, default_for)
SELECT 'kelsy', 'oportunidades', '{}'::text[]
WHERE NOT EXISTS (SELECT 1 FROM public.personas WHERE name = 'kelsy');
-- ============================================================================
-- FIN Migración 042_seed_personas
-- ============================================================================