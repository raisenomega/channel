-- HUB by Raisen — Bucket de logos del negocio (adjuntar logo en "Marca y contexto operacional").
-- Público de lectura (se muestra en la barra); el owner autenticado sube el suyo. La URL se guarda en
-- tenants.branding_config.logo_url (columna ya existente, migr 034). Idempotente.
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('tenant-logos', 'tenant-logos', true, 2097152, ARRAY['image/png','image/jpeg','image/webp','image/svg+xml'])
ON CONFLICT (id) DO UPDATE SET public = EXCLUDED.public, file_size_limit = EXCLUDED.file_size_limit, allowed_mime_types = EXCLUDED.allowed_mime_types;

DROP POLICY IF EXISTS tenant_logos_public_read ON storage.objects;
CREATE POLICY tenant_logos_public_read ON storage.objects FOR SELECT USING (bucket_id = 'tenant-logos');

DROP POLICY IF EXISTS tenant_logos_auth_write ON storage.objects;
CREATE POLICY tenant_logos_auth_write ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'tenant-logos');

DROP POLICY IF EXISTS tenant_logos_auth_update ON storage.objects;
CREATE POLICY tenant_logos_auth_update ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'tenant-logos');
