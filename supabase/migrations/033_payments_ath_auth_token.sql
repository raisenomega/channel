-- ============================================================================
-- HUB by Raisen — Migración 033: ATH Móvil REAL (3.2a-BIS)
--
-- Añade a `payments` los campos para el flujo real de ATH Móvil Busines:
--   - net_amount: importe neto tras fee (2.25% ya descontado por ATH), persiste
--     al confirmar el cobro.
--   - ath_auth_token_encrypted: JWT transitorio que devuelve /payment y que
--     se necesita para /authorization. Se guarda CIFRADO con encrypt_secret()
--     (pgp_sym_encrypt/aes256, clave app.enc_key) y se limpia al terminar.
--     NUNCA en texto plano (R14).
--
-- Idempotente: usa ADD COLUMN IF NOT EXISTS y CREATE OR REPLACE.
-- Error si app.enc_key no está configurada al cifrar/descifrar.
-- ============================================================================

-- Columna net_amount (numeric, nullable por ser post-cobro)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name   = 'payments'
      AND column_name  = 'net_amount'
  ) THEN
    ALTER TABLE public.payments ADD COLUMN net_amount numeric(12,2);
  END IF;
END;
$$;

-- Columna ath_auth_token_encrypted (JWT transitorio cifrado con encrypt_secret)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name   = 'payments'
      AND column_name  = 'ath_auth_token_encrypted'
  ) THEN
    ALTER TABLE public.payments ADD COLUMN ath_auth_token_encrypted text;
  END IF;
END;
$$;

-- Comentarios de columna: semántica y manejo
COMMENT ON COLUMN public.payments.net_amount IS
  'Importe neto tras fee (ATH descuenta 2.25%). Se persiste al confirmar COBRADO.';
COMMENT ON COLUMN public.payments.ath_auth_token_encrypted IS
  'JWT transitorio de ATH (de /payment) cifrado con encrypt_secret(). Efímero; se limpia al COMPLETED/CANCEL. Nunca texto plano.';

-- ============================================================================
-- FIN Migración 033
-- ============================================================================