-- 063 — Agenda Fase A: campos extra de la cita.
-- razon, acuerdo previo, tipo de reunion (presencial/llamada/video), link de videollamada,
-- recordatorios (jsonb = minutos antes), creador humano (uid + nombre snapshot), documento
-- vinculado y canales de envio (cola para cuando vuelva Railway).
-- attachment_id SIN FK (la tabla attachments no vive en migraciones). created_by_user_id = auth uid.
ALTER TABLE public.appointments
  ADD COLUMN IF NOT EXISTS reason text,
  ADD COLUMN IF NOT EXISTS pre_notes text,
  ADD COLUMN IF NOT EXISTS meeting_type text NOT NULL DEFAULT 'in_person' CHECK (meeting_type IN ('in_person','call','video')),
  ADD COLUMN IF NOT EXISTS meeting_url text,
  ADD COLUMN IF NOT EXISTS reminders jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS media jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS created_by_user_id uuid,
  ADD COLUMN IF NOT EXISTS created_by_name text,
  ADD COLUMN IF NOT EXISTS attachment_id uuid,
  ADD COLUMN IF NOT EXISTS send_channels text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS sent_at timestamptz;
