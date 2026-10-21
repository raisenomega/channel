-- =============================================================================
-- Migración 044 — HUB Connect Marketplace (pre-wired B2C + C2C)
-- Fecha: 2026-10-17 · Base: audit end-to-end 2026-10-17 + 043 aplicada
-- Doc maestro: HUB_Arquitectura_Expansible_B2C_C2C_Marketplace.md
--
-- Arquitectura expansible: todas las tablas quedan listas, pero marketplace
-- NO se activa hasta que `mkt_pricing_config.feature_flags.MARKETPLACE_ENABLED`=true.
--
-- 14 tablas nuevas (prefijo `mkt_`):
--   1. mkt_individuals        2. mkt_categories         3. mkt_listings
--   4. mkt_listing_media      5. mkt_quotas             6. mkt_strikes
--   7. mkt_transactions       8. mkt_confirmations      9. mkt_disputes
--  10. mkt_moderation_queue  11. mkt_ratings           12. mkt_search_queries
--  13. mkt_pricing_config    14. mkt_inquiries
--
-- Extensiones: earthdistance + cube (ya pgcrypto, pg_trgm, pgvector instalados)
-- Storage bucket: listings-media (público read, service_role write)
-- Idempotente: CREATE IF NOT EXISTS + DROP POLICY IF EXISTS + ON CONFLICT
-- =============================================================================

BEGIN;

-- =============================================================================
-- §A. Extensiones
-- =============================================================================

-- Geolocalización radio-search (earth_distance + cube)
CREATE EXTENSION IF NOT EXISTS cube;
CREATE EXTENSION IF NOT EXISTS earthdistance;

-- pgvector ya está instalado (migración 016) pero asegurar schema correcto
CREATE EXTENSION IF NOT EXISTS vector SCHEMA extensions;

-- pg_trgm para búsqueda fuzzy (ya instalado, idempotente)
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- unaccent para búsqueda sin acentos (ya instalado, idempotente)
CREATE EXTENSION IF NOT EXISTS unaccent;


-- =============================================================================
-- §B. Tabla 1 — mkt_individuals (persona regular, comprador y/o vendedor)
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.mkt_individuals (
  id                        uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_hint               uuid REFERENCES public.tenants(id) ON DELETE SET NULL,
  user_id                   uuid REFERENCES public.users(id) ON DELETE SET NULL,

  -- Identidad
  display_name              text NOT NULL,
  phone_whatsapp            text NOT NULL,
  phone_verified            boolean NOT NULL DEFAULT false,
  phone_verified_at         timestamptz,
  email                     text,
  avatar_url                text,

  -- Role en marketplace
  can_sell_c2c              boolean NOT NULL DEFAULT true,
  can_buy                   boolean NOT NULL DEFAULT true,
  id_verified               boolean NOT NULL DEFAULT false,
  id_verified_at            timestamptz,
  id_verification_notes     text,

  -- Geolocalización base
  home_lat                  double precision,
  home_lng                  double precision,
  home_city                 text,
  home_region               text,
  home_country_code         text NOT NULL DEFAULT 'PR',

  -- Reputación eBay-style
  reputation_score          numeric(3,2),
  total_sales_count         int NOT NULL DEFAULT 0,
  total_purchases_count     int NOT NULL DEFAULT 0,
  disputes_opened_count     int NOT NULL DEFAULT 0,
  disputes_lost_count       int NOT NULL DEFAULT 0,

  -- Status
  status                    text NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'restricted', 'blocked', 'archived')),
  blocked_reason            text,

  -- Metadata
  created_at                timestamptz NOT NULL DEFAULT now(),
  updated_at                timestamptz NOT NULL DEFAULT now(),
  archived_at               timestamptz,

  UNIQUE (phone_whatsapp)
);

CREATE INDEX IF NOT EXISTS idx_mkt_individuals_phone
  ON public.mkt_individuals (phone_whatsapp);
CREATE INDEX IF NOT EXISTS idx_mkt_individuals_tenant_hint
  ON public.mkt_individuals (tenant_hint) WHERE tenant_hint IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_mkt_individuals_home_geo
  ON public.mkt_individuals USING gist (ll_to_earth(home_lat, home_lng))
  WHERE home_lat IS NOT NULL AND home_lng IS NOT NULL;

ALTER TABLE public.mkt_individuals ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS mkt_individuals_read_own ON public.mkt_individuals;
CREATE POLICY mkt_individuals_read_own ON public.mkt_individuals
  FOR SELECT USING (user_id = auth.uid() OR public.is_hub_admin());

DROP POLICY IF EXISTS mkt_individuals_insert_self ON public.mkt_individuals;
CREATE POLICY mkt_individuals_insert_self ON public.mkt_individuals
  FOR INSERT WITH CHECK (user_id = auth.uid() OR public.is_hub_admin());

DROP POLICY IF EXISTS mkt_individuals_update_own ON public.mkt_individuals;
CREATE POLICY mkt_individuals_update_own ON public.mkt_individuals
  FOR UPDATE USING (user_id = auth.uid() OR public.is_hub_admin());

DROP POLICY IF EXISTS mkt_individuals_service_role ON public.mkt_individuals;
CREATE POLICY mkt_individuals_service_role ON public.mkt_individuals
  FOR ALL USING (auth.jwt() ->> 'role' = 'service_role')
  WITH CHECK (auth.jwt() ->> 'role' = 'service_role');


-- =============================================================================
-- §C. Tabla 2 — mkt_categories (taxonomía jerárquica)
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.mkt_categories (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_id     uuid REFERENCES public.mkt_categories(id) ON DELETE RESTRICT,
  slug          text NOT NULL UNIQUE,
  name_es       text NOT NULL,
  name_en       text,
  icon          text,
  display_order int NOT NULL DEFAULT 100,
  is_active     boolean NOT NULL DEFAULT true,
  created_at    timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_mkt_categories_parent
  ON public.mkt_categories (parent_id);
CREATE INDEX IF NOT EXISTS idx_mkt_categories_slug
  ON public.mkt_categories (slug);

ALTER TABLE public.mkt_categories ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS mkt_categories_read_all ON public.mkt_categories;
CREATE POLICY mkt_categories_read_all ON public.mkt_categories
  FOR SELECT USING (true);

DROP POLICY IF EXISTS mkt_categories_write_admin ON public.mkt_categories;
CREATE POLICY mkt_categories_write_admin ON public.mkt_categories
  FOR ALL USING (public.is_hub_admin()) WITH CHECK (public.is_hub_admin());


-- =============================================================================
-- §D. Tabla 3 — mkt_listings (producto, B2C business o C2C individual)
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.mkt_listings (
  id                        uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Owner: B2C (tenant) o C2C (individual) — exactamente uno
  tenant_id                 uuid REFERENCES public.tenants(id) ON DELETE CASCADE,
  individual_id             uuid REFERENCES public.mkt_individuals(id) ON DELETE CASCADE,

  -- Tipo
  listing_type              text NOT NULL CHECK (listing_type IN ('business', 'individual')),
  tier                      text NOT NULL DEFAULT 'c2c' CHECK (tier IN ('c2c', 'b2c')),

  -- Contenido
  title                     text NOT NULL,
  description               text,
  category_id               uuid REFERENCES public.mkt_categories(id) ON DELETE SET NULL,
  condition                 text CHECK (condition IN ('new', 'used', 'refurbished', 'for_parts')),
  brand                     text,
  model                     text,

  -- Precio
  price_usd                 numeric(12,2) NOT NULL CHECK (price_usd >= 0),
  negotiable                boolean NOT NULL DEFAULT false,

  -- Geolocalización del producto
  location_lat              double precision,
  location_lng              double precision,
  address_text              text,
  city                      text,
  region                    text,
  country_code              text NOT NULL DEFAULT 'PR',

  -- Status
  status                    text NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft', 'pending_moderation', 'active', 'paused', 'sold', 'removed', 'expired')),
  moderation_status         text NOT NULL DEFAULT 'pending'
    CHECK (moderation_status IN ('pending', 'approved', 'rejected', 'edit_required')),
  moderation_notes          text,

  -- Expiración (C2C expira a los 30 días por default)
  expires_at                timestamptz,

  -- Search intelligent
  search_vector             extensions.vector(1536),
  search_tsv                tsvector,

  -- Métricas
  view_count                int NOT NULL DEFAULT 0,
  inquiry_count             int NOT NULL DEFAULT 0,

  -- Metadata
  created_at                timestamptz NOT NULL DEFAULT now(),
  updated_at                timestamptz NOT NULL DEFAULT now(),
  sold_at                   timestamptz,

  -- Constraint: exactamente uno de tenant_id o individual_id
  CHECK ((tenant_id IS NOT NULL AND individual_id IS NULL) OR
         (tenant_id IS NULL AND individual_id IS NOT NULL))
);

CREATE INDEX IF NOT EXISTS idx_mkt_listings_tenant
  ON public.mkt_listings (tenant_id) WHERE tenant_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_mkt_listings_individual
  ON public.mkt_listings (individual_id) WHERE individual_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_mkt_listings_category
  ON public.mkt_listings (category_id);
CREATE INDEX IF NOT EXISTS idx_mkt_listings_status
  ON public.mkt_listings (status) WHERE status = 'active';
CREATE INDEX IF NOT EXISTS idx_mkt_listings_price
  ON public.mkt_listings (price_usd);
CREATE INDEX IF NOT EXISTS idx_mkt_listings_created
  ON public.mkt_listings (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_mkt_listings_geo
  ON public.mkt_listings USING gist (ll_to_earth(location_lat, location_lng))
  WHERE location_lat IS NOT NULL AND location_lng IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_mkt_listings_tsv
  ON public.mkt_listings USING gin (search_tsv);
CREATE INDEX IF NOT EXISTS idx_mkt_listings_title_trgm
  ON public.mkt_listings USING gin (title gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_mkt_listings_search_vector
  ON public.mkt_listings USING ivfflat (search_vector extensions.vector_cosine_ops) WITH (lists = 100);

ALTER TABLE public.mkt_listings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS mkt_listings_public_read_active ON public.mkt_listings;
CREATE POLICY mkt_listings_public_read_active ON public.mkt_listings
  FOR SELECT USING (status = 'active' AND moderation_status = 'approved');

DROP POLICY IF EXISTS mkt_listings_owner_full ON public.mkt_listings;
CREATE POLICY mkt_listings_owner_full ON public.mkt_listings
  FOR ALL USING (
    (tenant_id = public.current_tenant()) OR
    (individual_id IN (SELECT id FROM public.mkt_individuals WHERE user_id = auth.uid())) OR
    public.is_hub_admin()
  ) WITH CHECK (
    (tenant_id = public.current_tenant()) OR
    (individual_id IN (SELECT id FROM public.mkt_individuals WHERE user_id = auth.uid())) OR
    public.is_hub_admin()
  );

DROP POLICY IF EXISTS mkt_listings_service_role ON public.mkt_listings;
CREATE POLICY mkt_listings_service_role ON public.mkt_listings
  FOR ALL USING (auth.jwt() ->> 'role' = 'service_role')
  WITH CHECK (auth.jwt() ->> 'role' = 'service_role');


-- =============================================================================
-- §E. Tabla 4 — mkt_listing_media (fotos y videos)
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.mkt_listing_media (
  id                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id         uuid NOT NULL REFERENCES public.mkt_listings(id) ON DELETE CASCADE,
  media_type         text NOT NULL CHECK (media_type IN ('photo', 'video')),
  storage_path       text NOT NULL,
  thumbnail_path     text,
  mime_type          text NOT NULL,
  file_size_bytes    bigint NOT NULL,
  width              int,
  height             int,
  duration_seconds   int,
  position           int NOT NULL DEFAULT 0,
  uploaded_at        timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_mkt_listing_media_listing
  ON public.mkt_listing_media (listing_id, position);

ALTER TABLE public.mkt_listing_media ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS mkt_listing_media_public_read ON public.mkt_listing_media;
CREATE POLICY mkt_listing_media_public_read ON public.mkt_listing_media
  FOR SELECT USING (
    listing_id IN (SELECT id FROM public.mkt_listings WHERE status='active' AND moderation_status='approved')
    OR public.is_hub_admin()
  );

DROP POLICY IF EXISTS mkt_listing_media_service_role ON public.mkt_listing_media;
CREATE POLICY mkt_listing_media_service_role ON public.mkt_listing_media
  FOR ALL USING (auth.jwt() ->> 'role' = 'service_role')
  WITH CHECK (auth.jwt() ->> 'role' = 'service_role');


-- =============================================================================
-- §F. Tabla 5 — mkt_quotas (Rolling 30 días tracker)
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.mkt_quotas (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  individual_id   uuid NOT NULL REFERENCES public.mkt_individuals(id) ON DELETE CASCADE,
  listing_id      uuid NOT NULL REFERENCES public.mkt_listings(id) ON DELETE CASCADE,
  consumed_at     timestamptz NOT NULL DEFAULT now(),
  UNIQUE (listing_id)
);

CREATE INDEX IF NOT EXISTS idx_mkt_quotas_individual_consumed
  ON public.mkt_quotas (individual_id, consumed_at DESC);

ALTER TABLE public.mkt_quotas ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS mkt_quotas_read_own ON public.mkt_quotas;
CREATE POLICY mkt_quotas_read_own ON public.mkt_quotas
  FOR SELECT USING (
    individual_id IN (SELECT id FROM public.mkt_individuals WHERE user_id = auth.uid())
    OR public.is_hub_admin()
  );

DROP POLICY IF EXISTS mkt_quotas_service_role ON public.mkt_quotas;
CREATE POLICY mkt_quotas_service_role ON public.mkt_quotas
  FOR ALL USING (auth.jwt() ->> 'role' = 'service_role')
  WITH CHECK (auth.jwt() ->> 'role' = 'service_role');


-- =============================================================================
-- §G. Tabla 6 — mkt_strikes (2 strikes para >$500 C2C)
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.mkt_strikes (
  id                   uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  individual_id        uuid NOT NULL REFERENCES public.mkt_individuals(id) ON DELETE CASCADE,
  listing_id           uuid REFERENCES public.mkt_listings(id) ON DELETE SET NULL,
  strike_number        int NOT NULL,
  reason               text NOT NULL DEFAULT 'c2c_over_500',
  issued_at            timestamptz NOT NULL DEFAULT now(),
  resolved_at          timestamptz,
  resolved_by_action   text,
  UNIQUE (individual_id, strike_number)
);

CREATE INDEX IF NOT EXISTS idx_mkt_strikes_individual
  ON public.mkt_strikes (individual_id, issued_at DESC);

ALTER TABLE public.mkt_strikes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS mkt_strikes_read_own ON public.mkt_strikes;
CREATE POLICY mkt_strikes_read_own ON public.mkt_strikes
  FOR SELECT USING (
    individual_id IN (SELECT id FROM public.mkt_individuals WHERE user_id = auth.uid())
    OR public.is_hub_admin()
  );

DROP POLICY IF EXISTS mkt_strikes_service_role ON public.mkt_strikes;
CREATE POLICY mkt_strikes_service_role ON public.mkt_strikes
  FOR ALL USING (auth.jwt() ->> 'role' = 'service_role')
  WITH CHECK (auth.jwt() ->> 'role' = 'service_role');


-- =============================================================================
-- §H. Tabla 7 — mkt_transactions (TODAS las transacciones registradas)
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.mkt_transactions (
  id                             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id                     uuid NOT NULL REFERENCES public.mkt_listings(id),

  -- Partes
  buyer_individual_id            uuid REFERENCES public.mkt_individuals(id),
  seller_individual_id           uuid REFERENCES public.mkt_individuals(id),
  seller_tenant_id               uuid REFERENCES public.tenants(id),

  -- Montos
  amount_usd                     numeric(12,2) NOT NULL CHECK (amount_usd >= 0),
  platform_fee_pct               numeric(5,2) NOT NULL DEFAULT 0,
  platform_fee_usd               numeric(12,2) NOT NULL DEFAULT 0,
  net_amount_usd                 numeric(12,2) NOT NULL DEFAULT 0,
  currency                       text NOT NULL DEFAULT 'USD',

  -- Método de pago
  payment_method                 text NOT NULL CHECK (payment_method IN (
    'stripe_direct', 'stripe_escrow', 'ath_movil_direct', 'ath_business', 'cash_offline', 'other'
  )),
  payment_provider_tx_id         text,

  -- Escrow (si aplica)
  escrow_state                   text NOT NULL DEFAULT 'n/a' CHECK (escrow_state IN (
    'n/a', 'held', 'released', 'refunded', 'disputed'
  )),
  escrow_release_token           text,

  -- Tier
  tier                           text NOT NULL CHECK (tier IN ('c2c', 'b2c')),

  -- Status general
  status                         text NOT NULL DEFAULT 'pending_payment' CHECK (status IN (
    'pending_payment', 'payment_confirmed', 'awaiting_delivery',
    'delivered', 'confirmed_satisfaction', 'disputed', 'resolved_refund',
    'resolved_release', 'cancelled'
  )),

  -- Timestamps bank-grade
  initiated_at                   timestamptz NOT NULL DEFAULT now(),
  payment_at                     timestamptz,
  delivered_at                   timestamptz,
  confirmed_at                   timestamptz,
  disputed_at                    timestamptz,
  resolved_at                    timestamptz,

  -- Fiscalización
  tax_year                       int,
  fiscal_report_included         boolean NOT NULL DEFAULT false,

  -- Metadata
  metadata                       jsonb,

  -- Constraint: exactamente uno de seller_individual o seller_tenant
  CHECK ((seller_individual_id IS NOT NULL AND seller_tenant_id IS NULL) OR
         (seller_individual_id IS NULL AND seller_tenant_id IS NOT NULL))
);

CREATE INDEX IF NOT EXISTS idx_mkt_tx_listing
  ON public.mkt_transactions (listing_id);
CREATE INDEX IF NOT EXISTS idx_mkt_tx_buyer
  ON public.mkt_transactions (buyer_individual_id);
CREATE INDEX IF NOT EXISTS idx_mkt_tx_seller_ind
  ON public.mkt_transactions (seller_individual_id) WHERE seller_individual_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_mkt_tx_seller_tenant
  ON public.mkt_transactions (seller_tenant_id) WHERE seller_tenant_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_mkt_tx_status
  ON public.mkt_transactions (status, initiated_at DESC);
CREATE INDEX IF NOT EXISTS idx_mkt_tx_tax_year
  ON public.mkt_transactions (tax_year) WHERE tax_year IS NOT NULL;

ALTER TABLE public.mkt_transactions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS mkt_tx_read_parties ON public.mkt_transactions;
CREATE POLICY mkt_tx_read_parties ON public.mkt_transactions
  FOR SELECT USING (
    buyer_individual_id IN (SELECT id FROM public.mkt_individuals WHERE user_id = auth.uid())
    OR seller_individual_id IN (SELECT id FROM public.mkt_individuals WHERE user_id = auth.uid())
    OR seller_tenant_id = public.current_tenant()
    OR public.is_hub_admin()
  );

DROP POLICY IF EXISTS mkt_tx_service_role ON public.mkt_transactions;
CREATE POLICY mkt_tx_service_role ON public.mkt_transactions
  FOR ALL USING (auth.jwt() ->> 'role' = 'service_role')
  WITH CHECK (auth.jwt() ->> 'role' = 'service_role');


-- =============================================================================
-- §I. Tabla 8 — mkt_confirmations (proof-of-satisfaction del comprador)
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.mkt_confirmations (
  id                       uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_id           uuid NOT NULL REFERENCES public.mkt_transactions(id) ON DELETE RESTRICT,
  confirmed_by_individual_id uuid NOT NULL REFERENCES public.mkt_individuals(id),

  -- Payload de la confirmación
  confirmation_text        text NOT NULL,
  confirmation_hash_sha256 text NOT NULL,
  whatsapp_message_id      text,
  whatsapp_timestamp       timestamptz,

  -- Metadata evidencia
  ip_address               inet,
  user_agent               text,
  geo_lat                  double precision,
  geo_lng                  double precision,

  -- Timestamps bank-grade
  confirmed_at             timestamptz NOT NULL DEFAULT now(),

  UNIQUE (transaction_id)
);

CREATE INDEX IF NOT EXISTS idx_mkt_confirmations_tx
  ON public.mkt_confirmations (transaction_id);

ALTER TABLE public.mkt_confirmations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS mkt_confirmations_read_parties ON public.mkt_confirmations;
CREATE POLICY mkt_confirmations_read_parties ON public.mkt_confirmations
  FOR SELECT USING (
    transaction_id IN (
      SELECT id FROM public.mkt_transactions WHERE
        buyer_individual_id IN (SELECT id FROM public.mkt_individuals WHERE user_id = auth.uid())
        OR seller_individual_id IN (SELECT id FROM public.mkt_individuals WHERE user_id = auth.uid())
        OR seller_tenant_id = public.current_tenant()
    )
    OR public.is_hub_admin()
  );

DROP POLICY IF EXISTS mkt_confirmations_service_role ON public.mkt_confirmations;
CREATE POLICY mkt_confirmations_service_role ON public.mkt_confirmations
  FOR ALL USING (auth.jwt() ->> 'role' = 'service_role')
  WITH CHECK (auth.jwt() ->> 'role' = 'service_role');


-- =============================================================================
-- §J. Tabla 9 — mkt_disputes (AI-first + escalado humano)
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.mkt_disputes (
  id                         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_id             uuid NOT NULL REFERENCES public.mkt_transactions(id),
  raised_by_individual_id    uuid NOT NULL REFERENCES public.mkt_individuals(id),

  dispute_type               text NOT NULL CHECK (dispute_type IN (
    'not_received', 'not_as_described', 'damaged', 'fake', 'other'
  )),
  description                text,
  evidence_media_ids         uuid[],
  evidence_whatsapp_message_ids text[],

  -- AI analysis
  ai_recommendation          text CHECK (ai_recommendation IN ('refund_buyer', 'release_to_seller', 'escalate_human')),
  ai_confidence              numeric(3,2),
  ai_reasoning               text,
  ai_analyzed_at             timestamptz,

  -- Resolución humana (si escalado)
  human_decision             text CHECK (human_decision IN ('refund_buyer', 'release_to_seller', 'partial_refund', 'other')),
  human_decided_by           uuid REFERENCES public.users(id),
  human_decided_at           timestamptz,
  human_notes                text,

  -- Status
  status                     text NOT NULL DEFAULT 'open' CHECK (status IN (
    'open', 'ai_analyzed', 'human_review', 'resolved', 'closed'
  )),

  resolution                 text,
  resolution_amount_refund   numeric(12,2),

  opened_at                  timestamptz NOT NULL DEFAULT now(),
  resolved_at                timestamptz
);

CREATE INDEX IF NOT EXISTS idx_mkt_disputes_tx
  ON public.mkt_disputes (transaction_id);
CREATE INDEX IF NOT EXISTS idx_mkt_disputes_status
  ON public.mkt_disputes (status, opened_at DESC);

ALTER TABLE public.mkt_disputes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS mkt_disputes_read_parties ON public.mkt_disputes;
CREATE POLICY mkt_disputes_read_parties ON public.mkt_disputes
  FOR SELECT USING (
    transaction_id IN (
      SELECT id FROM public.mkt_transactions WHERE
        buyer_individual_id IN (SELECT id FROM public.mkt_individuals WHERE user_id = auth.uid())
        OR seller_individual_id IN (SELECT id FROM public.mkt_individuals WHERE user_id = auth.uid())
        OR seller_tenant_id = public.current_tenant()
    )
    OR public.is_hub_admin()
  );

DROP POLICY IF EXISTS mkt_disputes_service_role ON public.mkt_disputes;
CREATE POLICY mkt_disputes_service_role ON public.mkt_disputes
  FOR ALL USING (auth.jwt() ->> 'role' = 'service_role')
  WITH CHECK (auth.jwt() ->> 'role' = 'service_role');


-- =============================================================================
-- §K. Tabla 10 — mkt_moderation_queue (AI + humano)
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.mkt_moderation_queue (
  id                      uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  content_type            text NOT NULL CHECK (content_type IN ('listing', 'message', 'media', 'profile')),
  content_id              uuid NOT NULL,

  -- AI analysis
  ai_flags                text[],
  ai_confidence           numeric(3,2),
  ai_decision             text CHECK (ai_decision IN ('approve', 'reject', 'review')),
  ai_notes                text,
  ai_analyzed_at          timestamptz,

  -- Human review (si escalado)
  human_review_required   boolean NOT NULL DEFAULT false,
  human_decision          text CHECK (human_decision IN ('approve', 'reject', 'edit_required')),
  human_decided_by        uuid REFERENCES public.users(id),
  human_decided_at        timestamptz,
  human_notes             text,

  status                  text NOT NULL DEFAULT 'pending' CHECK (status IN (
    'pending', 'ai_decided', 'human_review', 'resolved'
  )),

  created_at              timestamptz NOT NULL DEFAULT now(),
  updated_at              timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_mkt_moderation_pending
  ON public.mkt_moderation_queue (status, created_at) WHERE status IN ('pending', 'human_review');
CREATE INDEX IF NOT EXISTS idx_mkt_moderation_content
  ON public.mkt_moderation_queue (content_type, content_id);

ALTER TABLE public.mkt_moderation_queue ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS mkt_moderation_admin_only ON public.mkt_moderation_queue;
CREATE POLICY mkt_moderation_admin_only ON public.mkt_moderation_queue
  FOR ALL USING (public.is_hub_admin()) WITH CHECK (public.is_hub_admin());

DROP POLICY IF EXISTS mkt_moderation_service_role ON public.mkt_moderation_queue;
CREATE POLICY mkt_moderation_service_role ON public.mkt_moderation_queue
  FOR ALL USING (auth.jwt() ->> 'role' = 'service_role')
  WITH CHECK (auth.jwt() ->> 'role' = 'service_role');


-- =============================================================================
-- §L. Tabla 11 — mkt_ratings (reputación eBay-style)
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.mkt_ratings (
  id                       uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_id           uuid NOT NULL REFERENCES public.mkt_transactions(id),
  rated_individual_id      uuid NOT NULL REFERENCES public.mkt_individuals(id),
  rater_individual_id      uuid NOT NULL REFERENCES public.mkt_individuals(id),
  rater_role               text NOT NULL CHECK (rater_role IN ('buyer', 'seller')),

  stars                    int NOT NULL CHECK (stars BETWEEN 1 AND 5),
  comment                  text,

  created_at               timestamptz NOT NULL DEFAULT now(),

  UNIQUE (transaction_id, rater_individual_id)
);

CREATE INDEX IF NOT EXISTS idx_mkt_ratings_rated
  ON public.mkt_ratings (rated_individual_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_mkt_ratings_tx
  ON public.mkt_ratings (transaction_id);

ALTER TABLE public.mkt_ratings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS mkt_ratings_public_read ON public.mkt_ratings;
CREATE POLICY mkt_ratings_public_read ON public.mkt_ratings
  FOR SELECT USING (true);

DROP POLICY IF EXISTS mkt_ratings_service_role ON public.mkt_ratings;
CREATE POLICY mkt_ratings_service_role ON public.mkt_ratings
  FOR ALL USING (auth.jwt() ->> 'role' = 'service_role')
  WITH CHECK (auth.jwt() ->> 'role' = 'service_role');


-- =============================================================================
-- §M. Tabla 12 — mkt_search_queries (log + ML training)
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.mkt_search_queries (
  id                       uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  individual_id            uuid REFERENCES public.mkt_individuals(id) ON DELETE SET NULL,
  query_text               text NOT NULL,
  parsed_intent            jsonb,
  user_lat                 double precision,
  user_lng                 double precision,
  results_shown            uuid[],
  clicked_listing_id       uuid REFERENCES public.mkt_listings(id) ON DELETE SET NULL,
  converted_to_transaction boolean NOT NULL DEFAULT false,
  created_at               timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_mkt_search_queries_individual
  ON public.mkt_search_queries (individual_id, created_at DESC) WHERE individual_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_mkt_search_queries_created
  ON public.mkt_search_queries (created_at DESC);

ALTER TABLE public.mkt_search_queries ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS mkt_search_queries_admin_only ON public.mkt_search_queries;
CREATE POLICY mkt_search_queries_admin_only ON public.mkt_search_queries
  FOR SELECT USING (public.is_hub_admin());

DROP POLICY IF EXISTS mkt_search_queries_service_role ON public.mkt_search_queries;
CREATE POLICY mkt_search_queries_service_role ON public.mkt_search_queries
  FOR ALL USING (auth.jwt() ->> 'role' = 'service_role')
  WITH CHECK (auth.jwt() ->> 'role' = 'service_role');


-- =============================================================================
-- §N. Tabla 13 — mkt_pricing_config (SuperAdmin panel)
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.mkt_pricing_config (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  scope           text NOT NULL CHECK (scope IN ('global', 'tenant', 'individual')),
  scope_id        uuid,
  config_key      text NOT NULL,
  config_value    jsonb NOT NULL,
  notes           text,
  created_by      uuid REFERENCES public.users(id),
  updated_by      uuid REFERENCES public.users(id),
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now(),

  CHECK ((scope = 'global' AND scope_id IS NULL) OR
         (scope != 'global' AND scope_id IS NOT NULL)),
  UNIQUE (scope, scope_id, config_key)
);

CREATE INDEX IF NOT EXISTS idx_mkt_pricing_config_scope
  ON public.mkt_pricing_config (scope, scope_id, config_key);

ALTER TABLE public.mkt_pricing_config ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS mkt_pricing_config_admin_only ON public.mkt_pricing_config;
CREATE POLICY mkt_pricing_config_admin_only ON public.mkt_pricing_config
  FOR ALL USING (public.is_hub_admin()) WITH CHECK (public.is_hub_admin());

DROP POLICY IF EXISTS mkt_pricing_config_service_role ON public.mkt_pricing_config;
CREATE POLICY mkt_pricing_config_service_role ON public.mkt_pricing_config
  FOR ALL USING (auth.jwt() ->> 'role' = 'service_role')
  WITH CHECK (auth.jwt() ->> 'role' = 'service_role');

-- Seed inicial de feature flags
INSERT INTO public.mkt_pricing_config (scope, scope_id, config_key, config_value, notes) VALUES
  ('global', NULL, 'feature_flags', '{
    "MARKETPLACE_ENABLED": false,
    "C2C_ENABLED": false,
    "B2C_MARKETPLACE_ENABLED": false,
    "SEARCH_INTELLIGENT_ENABLED": false,
    "ESCROW_STRIPE_ENABLED": false,
    "ATH_MOVIL_TRACKED_ENABLED": false,
    "MODERATION_AI_ENABLED": false,
    "RATINGS_ENABLED": false,
    "WHATSAPP_PROVIDER": "zernio"
  }'::jsonb, 'Feature flags iniciales — todos desactivados hasta validación'),
  ('global', NULL, 'limits', '{
    "C2C_MAX_LISTINGS_PER_30_DAYS": 3,
    "C2C_MAX_AMOUNT_USD": 500,
    "C2C_STRIKES_BEFORE_BLOCK": 2,
    "MEDIA_MAX_SIZE_MB": 25,
    "DESCRIPTION_MAX_CHARS": 2000
  }'::jsonb, 'Límites bank-grade iniciales'),
  ('global', NULL, 'fees', '{
    "C2C_NORMAL_FEE_PCT": 5,
    "C2C_HIGH_FEE_PCT": 15,
    "B2C_MARKETPLACE_FEE_PCT": 2.5
  }'::jsonb, 'Fees por default — ajustables desde SuperAdmin panel'),
  ('global', NULL, 'reputation_tiers', '{
    "trusted_min": 4.5,
    "standard_min": 3.5,
    "watch_min": 2.5,
    "trusted_fee_discount_pct": 20,
    "watch_fee_surcharge_pct": 10,
    "newcomer_initial_tx_count": 3,
    "newcomer_fee_surcharge_pct": 5
  }'::jsonb, 'Reputación eBay-style — tiers y beneficios')
ON CONFLICT (scope, scope_id, config_key) DO NOTHING;


-- =============================================================================
-- §O. Tabla 14 — mkt_inquiries (hilo buyer ↔ seller WhatsApp)
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.mkt_inquiries (
  id                       uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id               uuid NOT NULL REFERENCES public.mkt_listings(id) ON DELETE CASCADE,
  buyer_individual_id      uuid NOT NULL REFERENCES public.mkt_individuals(id),
  seller_individual_id     uuid REFERENCES public.mkt_individuals(id),
  seller_tenant_id         uuid REFERENCES public.tenants(id),
  whatsapp_thread_id       text,
  status                   text NOT NULL DEFAULT 'open' CHECK (status IN (
    'open', 'negotiating', 'closed_bought', 'closed_lost', 'closed_abandoned'
  )),
  last_message_at          timestamptz,
  created_at               timestamptz NOT NULL DEFAULT now(),
  closed_at                timestamptz,

  CHECK ((seller_individual_id IS NOT NULL AND seller_tenant_id IS NULL) OR
         (seller_individual_id IS NULL AND seller_tenant_id IS NOT NULL))
);

CREATE INDEX IF NOT EXISTS idx_mkt_inquiries_listing
  ON public.mkt_inquiries (listing_id);
CREATE INDEX IF NOT EXISTS idx_mkt_inquiries_buyer
  ON public.mkt_inquiries (buyer_individual_id);

ALTER TABLE public.mkt_inquiries ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS mkt_inquiries_read_parties ON public.mkt_inquiries;
CREATE POLICY mkt_inquiries_read_parties ON public.mkt_inquiries
  FOR SELECT USING (
    buyer_individual_id IN (SELECT id FROM public.mkt_individuals WHERE user_id = auth.uid())
    OR seller_individual_id IN (SELECT id FROM public.mkt_individuals WHERE user_id = auth.uid())
    OR seller_tenant_id = public.current_tenant()
    OR public.is_hub_admin()
  );

DROP POLICY IF EXISTS mkt_inquiries_service_role ON public.mkt_inquiries;
CREATE POLICY mkt_inquiries_service_role ON public.mkt_inquiries
  FOR ALL USING (auth.jwt() ->> 'role' = 'service_role')
  WITH CHECK (auth.jwt() ->> 'role' = 'service_role');


-- =============================================================================
-- §P. Supabase Storage bucket — listings-media
-- =============================================================================

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'listings-media',
  'listings-media',
  true,
  26214400, -- 25 MB
  ARRAY[
    'image/jpeg', 'image/png', 'image/webp', 'image/gif',
    'video/mp4', 'video/quicktime', 'video/webm'
  ]
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 26214400,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Políticas del bucket (idempotentes)
DROP POLICY IF EXISTS listings_media_public_read ON storage.objects;
CREATE POLICY listings_media_public_read ON storage.objects
  FOR SELECT USING (bucket_id = 'listings-media');

DROP POLICY IF EXISTS listings_media_service_role_write ON storage.objects;
CREATE POLICY listings_media_service_role_write ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'listings-media' AND auth.jwt() ->> 'role' = 'service_role'
  );

DROP POLICY IF EXISTS listings_media_service_role_update ON storage.objects;
CREATE POLICY listings_media_service_role_update ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'listings-media' AND auth.jwt() ->> 'role' = 'service_role'
  );

DROP POLICY IF EXISTS listings_media_service_role_delete ON storage.objects;
CREATE POLICY listings_media_service_role_delete ON storage.objects
  FOR DELETE USING (
    bucket_id = 'listings-media' AND auth.jwt() ->> 'role' = 'service_role'
  );


-- =============================================================================
-- §Q. Trigger auto-update de search_tsv en mkt_listings
-- =============================================================================

CREATE OR REPLACE FUNCTION public.mkt_listings_update_tsv()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.search_tsv :=
    setweight(to_tsvector('spanish', unaccent(COALESCE(NEW.title, ''))), 'A') ||
    setweight(to_tsvector('spanish', unaccent(COALESCE(NEW.brand, ''))), 'B') ||
    setweight(to_tsvector('spanish', unaccent(COALESCE(NEW.model, ''))), 'B') ||
    setweight(to_tsvector('spanish', unaccent(COALESCE(NEW.description, ''))), 'C');
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_mkt_listings_tsv ON public.mkt_listings;
CREATE TRIGGER trg_mkt_listings_tsv
  BEFORE INSERT OR UPDATE OF title, brand, model, description
  ON public.mkt_listings
  FOR EACH ROW EXECUTE FUNCTION public.mkt_listings_update_tsv();


-- =============================================================================
-- §R. Trigger auto-update reputation_score en mkt_individuals
-- =============================================================================

CREATE OR REPLACE FUNCTION public.mkt_update_reputation_score()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE public.mkt_individuals
  SET reputation_score = (
    SELECT ROUND(AVG(stars)::numeric, 2)
    FROM public.mkt_ratings
    WHERE rated_individual_id = NEW.rated_individual_id
      AND created_at > now() - interval '365 days'
  ),
  updated_at = now()
  WHERE id = NEW.rated_individual_id;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_mkt_ratings_update_reputation ON public.mkt_ratings;
CREATE TRIGGER trg_mkt_ratings_update_reputation
  AFTER INSERT OR UPDATE
  ON public.mkt_ratings
  FOR EACH ROW EXECUTE FUNCTION public.mkt_update_reputation_score();


-- =============================================================================
-- §S. Grants
-- =============================================================================

GRANT SELECT ON public.mkt_categories TO anon, authenticated;
GRANT SELECT ON public.mkt_listings TO anon, authenticated;
GRANT SELECT ON public.mkt_listing_media TO anon, authenticated;
GRANT SELECT ON public.mkt_ratings TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE ON public.mkt_individuals TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.mkt_inquiries TO authenticated;
GRANT SELECT ON public.mkt_transactions TO authenticated;

GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;


COMMIT;


-- =============================================================================
-- §T. Smoke tests (ejecutar manualmente post-migración)
-- =============================================================================
-- Verificar que las 14 tablas existen
-- SELECT table_name FROM information_schema.tables
-- WHERE table_schema = 'public' AND table_name LIKE 'mkt_%'
-- ORDER BY table_name;
-- → esperado: 14 filas

-- Verificar extensiones críticas
-- SELECT extname FROM pg_extension WHERE extname IN ('earthdistance', 'cube', 'vector', 'pg_trgm', 'unaccent');
-- → esperado: 5 filas

-- Verificar bucket Storage
-- SELECT id, name, public, file_size_limit FROM storage.buckets WHERE id = 'listings-media';
-- → esperado: 1 fila

-- Verificar seed de pricing config
-- SELECT config_key, jsonb_pretty(config_value) FROM public.mkt_pricing_config WHERE scope='global';
-- → esperado: 4 filas (feature_flags, limits, fees, reputation_tiers)

-- Test funcional earthdistance (debe devolver ~distancia Mayaguez a San Juan ~155km)
-- SELECT earth_distance(ll_to_earth(18.2013, -67.1397), ll_to_earth(18.4655, -66.1057)) / 1000 AS km;
-- → esperado: ~155 km

-- Test funcional vector (debe devolver 1 fila)
-- SELECT 1 WHERE 'extensions.vector' IS NOT NULL;
-- → esperado: 1 fila

-- =============================================================================
-- Fin migración 044 — HUB Connect Marketplace pre-wired
-- =============================================================================
