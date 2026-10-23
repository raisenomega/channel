-- 085 — Endurecimiento anti web-shell / XSS de los buckets de subida. Capa NO-BYPASSEABLE: el cliente
-- sube directo a Storage con su JWT, asi que la defensa real es la allowlist de mime del bucket. Se
-- QUITA image/svg+xml de logos (un SVG lleva JS -> XSS al servirse publico) y se fija allowlist estricta
-- + limite de tamano. Idempotente.
UPDATE storage.buckets SET
  allowed_mime_types = ARRAY['image/png', 'image/jpeg', 'image/webp'],
  file_size_limit = 2097152
WHERE id = 'tenant-logos';

UPDATE storage.buckets SET
  allowed_mime_types = ARRAY['image/png', 'image/jpeg', 'image/webp', 'image/gif',
    'video/mp4', 'video/webm', 'video/quicktime', 'application/pdf',
    'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
  file_size_limit = 52428800
WHERE id = 'appointment-media';
