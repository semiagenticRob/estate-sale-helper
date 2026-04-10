-- Migration 014: submit_review RPC
-- Geofence-checked, one update per calendar day per sale.
-- Recalculates review_aggregates on each submission.

CREATE OR REPLACE FUNCTION public.submit_review(
  p_sale_id UUID,
  p_device_id TEXT,
  p_lat DOUBLE PRECISION,
  p_lng DOUBLE PRECISION,
  p_pricing BOOLEAN,
  p_quality BOOLEAN,
  p_accuracy BOOLEAN,
  p_availability BOOLEAN
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
  v_agg RECORD;
BEGIN
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

  -- Check for existing review today
  SELECT * INTO v_existing
  FROM reviews
  WHERE sale_id = p_sale_id AND device_id = p_device_id;

  IF FOUND AND v_existing.updated_at::date = CURRENT_DATE
     AND v_existing.submitted_at::date = CURRENT_DATE THEN
    -- Already submitted and updated today — still allow changes within the day
    UPDATE reviews SET
      pricing_positive = p_pricing,
      quality_positive = p_quality,
      accuracy_positive = p_accuracy,
      availability_positive = p_availability,
      updated_at = NOW(),
      device_lat = p_lat,
      device_lng = p_lng
    WHERE sale_id = p_sale_id AND device_id = p_device_id;
  ELSIF FOUND THEN
    -- Existing from a previous day — allow update
    UPDATE reviews SET
      pricing_positive = p_pricing,
      quality_positive = p_quality,
      accuracy_positive = p_accuracy,
      availability_positive = p_availability,
      updated_at = NOW(),
      device_lat = p_lat,
      device_lng = p_lng
    WHERE sale_id = p_sale_id AND device_id = p_device_id;
  ELSE
    -- New review
    INSERT INTO reviews (sale_id, device_id, device_lat, device_lng,
      pricing_positive, quality_positive, accuracy_positive, availability_positive)
    VALUES (p_sale_id, p_device_id, p_lat, p_lng,
      p_pricing, p_quality, p_accuracy, p_availability);
  END IF;

  -- Recalculate review_aggregates
  SELECT
    COUNT(*) FILTER (WHERE pricing_positive) AS pp,
    COUNT(*) AS pt,
    COUNT(*) FILTER (WHERE quality_positive) AS qp,
    COUNT(*) AS qt,
    COUNT(*) FILTER (WHERE accuracy_positive) AS ap,
    COUNT(*) AS at_,
    COUNT(*) FILTER (WHERE availability_positive) AS avp,
    COUNT(*) AS avt
  INTO v_agg
  FROM reviews
  WHERE sale_id = p_sale_id;

  INSERT INTO review_aggregates (
    sale_id, pricing_pos, pricing_total, quality_pos, quality_total,
    accuracy_pos, accuracy_total, availability_pos, availability_total, last_calculated_at
  )
  VALUES (
    p_sale_id, v_agg.pp, v_agg.pt, v_agg.qp, v_agg.qt,
    v_agg.ap, v_agg.at_, v_agg.avp, v_agg.avt, NOW()
  )
  ON CONFLICT (sale_id) DO UPDATE SET
    pricing_pos = EXCLUDED.pricing_pos,
    pricing_total = EXCLUDED.pricing_total,
    quality_pos = EXCLUDED.quality_pos,
    quality_total = EXCLUDED.quality_total,
    accuracy_pos = EXCLUDED.accuracy_pos,
    accuracy_total = EXCLUDED.accuracy_total,
    availability_pos = EXCLUDED.availability_pos,
    availability_total = EXCLUDED.availability_total,
    last_calculated_at = NOW();

  RETURN jsonb_build_object(
    'ok', true,
    'pricing_pct', CASE WHEN v_agg.pt > 0 THEN round((v_agg.pp::numeric / v_agg.pt) * 100) ELSE 0 END,
    'quality_pct', CASE WHEN v_agg.qt > 0 THEN round((v_agg.qp::numeric / v_agg.qt) * 100) ELSE 0 END,
    'accuracy_pct', CASE WHEN v_agg.at_ > 0 THEN round((v_agg.ap::numeric / v_agg.at_) * 100) ELSE 0 END,
    'availability_pct', CASE WHEN v_agg.avt > 0 THEN round((v_agg.avp::numeric / v_agg.avt) * 100) ELSE 0 END,
    'total_reviews', v_agg.pt
  );
END;
$$;
