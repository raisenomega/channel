-- 081 — Media en mensajes: la URL del adjunto de Zernio (exige Bearer API key -> se sirve via proxy
-- backend como data URL base64) + su mime. content_type (011) ya soporta image/audio/video/document/sticker.
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS media_url text;
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS media_mime text;
