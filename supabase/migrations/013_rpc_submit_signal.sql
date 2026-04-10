-- Migration 013: submit_signal RPC
-- Geofence-checked, one change per calendar day per sale.
-- Recalculates sale_scores with 4hr exponential decay.

CREATE OR REPLACE FUNCTION public.submit_signal(
  p_sale_id UUID,
  p_device_id TEXT,
  p_signal_type TEXT,
  p_lat DOUBLE PRECISION,
  p_lng DOUBLE PRECISION
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_sale RECORD;
  v_dist DOUBLE PRECISION;
  v_existing RECORD;
  v_score_worth DOUBLE PRECISION;
  v_score_skip DOUBLE PRECISION;
  v_heat DOUBLE PRECISION;
  v_worth_count INTEGER;
  v_skip_count INTEGER;
BEGIN
  -- Validate signal type
  IF p_signal_type NOT IN ('worth_it', 'skip_it') THEN
    RETURN jsonb_build_object('ok', false, 'error', 'invalid_signal_type');
  END IF;

  -- Fetch sale coordinates
  SELECT latitude, longitude INTO v_sale
  FROM sales WHERE id = p_sale_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'error', 'sale_not_found');
  END IF;

  -- Haversine geofence check (0.5 miles)
  v_dist := 3959 * acos(
    LEAST(1.0, cos(radians(p_lat)) * cos(radians(v_sale.latitude)) *
    cos(radians(v_sale.longitude) - radians(p_lng)) +
    sin(radians(p_lat)) * sin(radians(v_sale.latitude)))
  );

  IF v_dist > 0.5 THEN
    RETURN jsonb_build_object('ok', false, 'error', 'outside_geofence', 'distance_miles', round(v_dist::numeric, 2));
  END IF;

  -- Check for existing signal today (one change per calendar day)
  SELECT * INTO v_existing
  FROM signals
  WHERE sale_id = p_sale_id AND device_id = p_device_id;

  IF FOUND AND v_existing.submitted_at::date = CURRENT_DATE THEN
    -- Same day — allow update (change of mind)
    UPDATE signals SET
      signal_type = p_signal_type,
      submitted_at = NOW(),
      device_lat = p_lat,
      device_lng = p_lng
    WHERE sale_id = p_sale_id AND device_id = p_device_id;
  ELSIF FOUND THEN
    -- Different day — allow new signal
    UPDATE signals SET
      signal_type = p_signal_type,
      submitted_at = NOW(),
      device_lat = p_lat,
      device_lng = p_lng
    WHERE sale_id = p_sale_id AND device_id = p_device_id;
  ELSE
    -- New signal
    INSERT INTO signals (sale_id, device_id, signal_type, device_lat, device_lng)
    VALUES (p_sale_id, p_device_id, p_signal_type, p_lat, p_lng);
  END IF;

  -- Recalculate sale_scores with 4hr exponential decay
  SELECT
    COALESCE(SUM(CASE WHEN signal_type = 'worth_it'
      THEN EXP(-EXTRACT(EPOCH FROM (NOW() - submitted_at)) / 14400.0)
      ELSE 0 END), 0),
    COALESCE(SUM(CASE WHEN signal_type = 'skip_it'
      THEN EXP(-EXTRACT(EPOCH FROM (NOW() - submitted_at)) / 14400.0)
      ELSE 0 END), 0),
    COUNT(*) FILTER (WHERE signal_type = 'worth_it'),
    COUNT(*) FILTER (WHERE signal_type = 'skip_it')
  INTO v_score_worth, v_score_skip, v_worth_count, v_skip_count
  FROM signals
  WHERE sale_id = p_sale_id;

  -- Heat score: worth_it / (worth_it + skip_it), 0 if no signals
  IF (v_score_worth + v_score_skip) > 0 THEN
    v_heat := v_score_worth / (v_score_worth + v_score_skip);
  ELSE
    v_heat := 0;
  END IF;

  INSERT INTO sale_scores (sale_id, worth_it_count, skip_it_count, heat_score, last_updated)
  VALUES (p_sale_id, v_worth_count, v_skip_count, v_heat, NOW())
  ON CONFLICT (sale_id) DO UPDATE SET
    worth_it_count = EXCLUDED.worth_it_count,
    skip_it_count = EXCLUDED.skip_it_count,
    heat_score = EXCLUDED.heat_score,
    last_updated = NOW();

  RETURN jsonb_build_object(
    'ok', true,
    'signal_type', p_signal_type,
    'heat_score', round(v_heat::numeric, 3),
    'worth_it_count', v_worth_count,
    'skip_it_count', v_skip_count
  );
END;
$$;
