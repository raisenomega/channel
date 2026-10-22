-- 065 — Agenda: mensaje de envio editable (lo que recibira el cliente por WA/IG/FB).
-- Se compone por defecto desde la cita y el owner lo edita en la vista previa; el backend
-- lo manda tal cual (via Zernio) al disparar, junto con send_channels. Idempotente.
ALTER TABLE public.appointments ADD COLUMN IF NOT EXISTS send_message text;
