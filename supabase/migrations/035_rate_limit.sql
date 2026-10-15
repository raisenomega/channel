-- ============================================================================
-- HUB by Raisen — Migración 035: Rate limit counters (Slide 3.3)
--
-- Tabla para throttling por (ip, path) sobre rutas públicas de la landing.
-- No tenant-scoped; service_role only. Ventana de 1 minuto truncado.
-- Idempotente: CREATE TABLE IF NOT EXISTS + CREATE INDEX IF NOT EXISTS.
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.rate_limit_counters (
  ip           text NOT NULL,
  path         text NOT NULL,
  window_start timestamptz NOT NULL,
  count        int NOT NULL DEFAULT 1,
  PRIMARY KEY (ip, path, window_start)
);

-- Para limpieza y consultas rápidas
CREATE INDEX IF NOT EXISTS idx_rate_limit_window ON public.rate_limit_counters(window_start);

-- RLS desactivada (no tenant-scoped; solo service_role accede)
ALTER TABLE public.rate_limit_counters DISABLE ROW LEVEL SECURITY;

COMMENT ON TABLE public.rate_limit_counters IS
  'Contadores de rate limit por (ip, path) y ventana de 1 minuto. Throttling de rutas públicas.';

-- RPC para incremento atómico dentro de la ventana actual (1 minuto truncado).
-- Devuelve el conteo tras incrementar; el caller decide el threshold.
CREATE OR REPLACE FUNCTION public.rate_limit_increment(p_ip text, p_path text)
RETURNS int
LANGUAGE plpgsql
VOLATILE
AS $$
DECLARE
  w timestamptz := date_trunc('minute', now());
  c int;
BEGIN
  INSERT INTO public.rate_limit_counters (ip, path, window_start, count)
  VALUES (p_ip, p_path, w, 1)
  ON CONFLICT (ip, path, window_start)
  DO UPDATE SET count = public.rate_limit_counters.count + 1
  RETURNING count INTO c;
  RETURN c;
END;
$$;

GRANT EXECUTE ON FUNCTION public.rate_limit_increment(text, text) TO service_role;

-- ============================================================================
-- FIN Migración 035
-- ============================================================================