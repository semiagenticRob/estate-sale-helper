-- Migration 012: Community signals & reviews tables
-- Anonymous device-ID-based, no auth required.

-- ============================================================
-- 1. Signals — "Worth It" / "Skip It" one-tap feedback
-- ============================================================
CREATE TABLE IF NOT EXISTS signals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sale_id UUID NOT NULL REFERENCES sales(id) ON DELETE CASCADE,
  device_id TEXT NOT NULL,
  signal_type TEXT NOT NULL CHECK (signal_type IN ('worth_it', 'skip_it')),
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  device_lat DOUBLE PRECISION,
  device_lng DOUBLE PRECISION,
  UNIQUE(sale_id, device_id)
);

CREATE INDEX IF NOT EXISTS idx_signals_sale ON signals(sale_id);
CREATE INDEX IF NOT EXISTS idx_signals_device ON signals(device_id);

-- ============================================================
-- 2. Sale scores — precomputed heat scores for map pins
-- ============================================================
CREATE TABLE IF NOT EXISTS sale_scores (
  sale_id UUID PRIMARY KEY REFERENCES sales(id) ON DELETE CASCADE,
  worth_it_count INTEGER NOT NULL DEFAULT 0,
  skip_it_count INTEGER NOT NULL DEFAULT 0,
  heat_score DOUBLE PRECISION NOT NULL DEFAULT 0,
  last_updated TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- 3. Reviews — 4-dimension tap reviews
-- ============================================================
CREATE TABLE IF NOT EXISTS reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sale_id UUID NOT NULL REFERENCES sales(id) ON DELETE CASCADE,
  device_id TEXT NOT NULL,
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  device_lat DOUBLE PRECISION,
  device_lng DOUBLE PRECISION,
  pricing_positive BOOLEAN NOT NULL,
  quality_positive BOOLEAN NOT NULL,
  accuracy_positive BOOLEAN NOT NULL,
  availability_positive BOOLEAN NOT NULL,
  UNIQUE(sale_id, device_id)
);

CREATE INDEX IF NOT EXISTS idx_reviews_sale ON reviews(sale_id);

-- ============================================================
-- 4. Review aggregates — precomputed per-sale summaries
-- ============================================================
CREATE TABLE IF NOT EXISTS review_aggregates (
  sale_id UUID PRIMARY KEY REFERENCES sales(id) ON DELETE CASCADE,
  pricing_pos INTEGER NOT NULL DEFAULT 0,
  pricing_total INTEGER NOT NULL DEFAULT 0,
  quality_pos INTEGER NOT NULL DEFAULT 0,
  quality_total INTEGER NOT NULL DEFAULT 0,
  accuracy_pos INTEGER NOT NULL DEFAULT 0,
  accuracy_total INTEGER NOT NULL DEFAULT 0,
  availability_pos INTEGER NOT NULL DEFAULT 0,
  availability_total INTEGER NOT NULL DEFAULT 0,
  last_calculated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- 5. RLS — public reads, writes via SECURITY DEFINER RPCs
-- ============================================================
ALTER TABLE signals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read signals" ON signals FOR SELECT TO anon, authenticated USING (true);

ALTER TABLE sale_scores ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read scores" ON sale_scores FOR SELECT TO anon, authenticated USING (true);

ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read reviews" ON reviews FOR SELECT TO anon, authenticated USING (true);

ALTER TABLE review_aggregates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read aggregates" ON review_aggregates FOR SELECT TO anon, authenticated USING (true);
