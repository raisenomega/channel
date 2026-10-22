-- 064 — Bucket de media de citas: adjuntar y luego enviar documento/imagen/video con la cita.
-- Publico de lectura (para que WA/IG/FB puedan jalar la URL al enviar); el owner autenticado sube.
-- Las URLs se guardan en appointments.media (jsonb array de {url,type,name}, migr 063). Idempotente.
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('appointment-media', 'appointment-media', true, 52428800,
  ARRAY['image/png','image/jpeg','image/webp','image/gif','video/mp4','video/webm','video/quicktime','application/pdf','application/msword','application/vnd.openxmlformats-officedocument.wordprocessingml.document'])
ON CONFLICT (id) DO UPDATE SET public = EXCLUDED.public, file_size_limit = EXCLUDED.file_size_limit, allowed_mime_types = EXCLUDED.allowed_mime_types;

DROP POLICY IF EXISTS appt_media_public_read ON storage.objects;
CREATE POLICY appt_media_public_read ON storage.objects FOR SELECT USING (bucket_id = 'appointment-media');

DROP POLICY IF EXISTS appt_media_auth_write ON storage.objects;
CREATE POLICY appt_media_auth_write ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'appointment-media');

DROP POLICY IF EXISTS appt_media_auth_update ON storage.objects;
CREATE POLICY appt_media_auth_update ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'appointment-media');
