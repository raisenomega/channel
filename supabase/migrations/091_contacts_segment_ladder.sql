-- HUB by Raisen — CRM auto-calificacion: alinea la escalera de VALOR del contacto con el frontend.
-- Escalera: general (base) -> nuevo (mostro intencion) -> regular (compro) -> vip (alto valor).
-- Antes la BD usaba new_lead/prospect/customer (que el front no sabe pintar -> chip "—"). Backfill a los nuevos.
-- Mantiene los valores legacy en el CHECK por seguridad. Default = 'general' (todo contacto nace con chip base).

ALTER TABLE public.contacts DROP CONSTRAINT IF EXISTS contacts_segment_check;
ALTER TABLE public.contacts ADD CONSTRAINT contacts_segment_check
  CHECK (segment IN ('general','nuevo','regular','vip',
                     'new_lead','prospect','customer','recurring','at_risk','churned','blocked'));

ALTER TABLE public.contacts ALTER COLUMN segment SET DEFAULT 'general';

UPDATE public.contacts SET segment = 'general' WHERE segment IS NULL OR segment IN ('new_lead','prospect');
UPDATE public.contacts SET segment = 'regular' WHERE segment IN ('customer','recurring');
