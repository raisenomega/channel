-- ROLLBACK 009: Eliminar tablas auxiliares de contacts
DROP TABLE IF EXISTS public.segments CASCADE;
DROP TABLE IF EXISTS public.contact_tags CASCADE;
DROP TABLE IF EXISTS public.tags CASCADE;
DROP TABLE IF EXISTS public.contact_notes CASCADE;
DROP TABLE IF EXISTS public.contact_channels CASCADE;