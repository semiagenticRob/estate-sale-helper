-- Migration 006: Add sale_hours column for daily schedule times
-- Also fix search_sales to include sales without coordinates

ALTER TABLE sales ADD COLUMN IF NOT EXISTS sale_hours TEXT;

-- Update upsert_sale to accept sale_hours
CREATE OR REPLACE FUNCTION upsert_sale(
  p_external_id  TEXT,
  p_title        TEXT,
  p_company_name TEXT,
  p_address      TEXT,
  p_city         TEXT,
  p_state        TEXT,
  p_zip_code     TEXT,
  p_latitude     DOUBLE PRECISION,
  p_longitude    DOUBLE PRECISION,
  p_start_date   DATE,
  p_end_date     DATE,
  p_description  TEXT,
  p_url          TEXT,
  p_terms        TEXT DEFAULT NULL,
  p_sale_hours   TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE sql
SECURITY DEFINER
AS $$
  INSERT INTO sales (
    external_id, title, company_name, address, city, state, zip_code,
    location, start_date, end_date, description, url, terms, sale_hours
  )
  VALUES (
    p_external_id, p_title, p_company_name, p_address,
    p_city, p_state, p_zip_code,
    CASE
      WHEN p_latitude IS NOT NULL AND p_longitude IS NOT NULL
      THEN ST_SetSRID(ST_MakePoint(p_longitude, p_latitude), 4326)::geography
      ELSE NULL
    END,
    p_start_date, p_end_date, p_description, p_url, p_terms, p_sale_hours
  )
  ON CONFLICT (external_id) DO UPDATE SET
    title        = EXCLUDED.title,
    company_name = EXCLUDED.company_name,
    address      = EXCLUDED.address,
    city         = EXCLUDED.city,
    state        = EXCLUDED.state,
    zip_code     = EXCLUDED.zip_code,
    location     = EXCLUDED.location,
    start_date   = EXCLUDED.start_date,
    end_date     = EXCLUDED.end_date,
    description  = EXCLUDED.description,
    url          = EXCLUDED.url,
    terms        = EXCLUDED.terms,
    sale_hours   = EXCLUDED.sale_hours
  RETURNING id;
$$;

-- Drop and recreate search_sales to include sales without coords
DROP FUNCTION IF EXISTS search_sales(text, double precision, double precision, integer, date, date);

CREATE OR REPLACE FUNCTION search_sales(
  query TEXT,
  user_lat DOUBLE PRECISION,
  user_lng DOUBLE PRECISION,
  radius_miles INTEGER DEFAULT 25,
  date_start DATE DEFAULT CURRENT_DATE,
  date_end DATE DEFAULT CURRENT_DATE + 7
)
RETURNS TABLE (
  id UUID,
  external_id TEXT,
  title TEXT,
  company_name TEXT,
  address TEXT,
  city TEXT,
  state TEXT,
  zip_code TEXT,
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  start_date DATE,
  end_date DATE,
  description TEXT,
  url TEXT,
  terms TEXT,
  sale_hours TEXT,
  distance_miles DOUBLE PRECISION,
  match_percent INTEGER,
  header_image_url TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    s.id,
    s.external_id,
    s.title,
    s.company_name,
    s.address,
    s.city,
    s.state,
    s.zip_code,
    s.latitude,
    s.longitude,
    s.start_date,
    s.end_date,
    s.description,
    s.url,
    s.terms,
    s.sale_hours,
    (3959 * acos(
      LEAST(1.0, cos(radians(user_lat)) * cos(radians(s.latitude)) *
      cos(radians(s.longitude) - radians(user_lng)) +
      sin(radians(user_lat)) * sin(radians(s.latitude)))
    )) AS distance_miles,
    CASE
      WHEN query = '' THEN 0
      ELSE LEAST(100, (ts_rank_cd(
        to_tsvector('english', COALESCE(s.title, '') || ' ' || COALESCE(s.description, '')),
        plainto_tsquery('english', query)
      ) * 100)::INTEGER)
    END AS match_percent,
    (SELECT si.image_url FROM sale_images si WHERE si.sale_id = s.id ORDER BY si.position LIMIT 1) AS header_image_url
  FROM sales s
  WHERE
    s.start_date <= date_end
    AND s.end_date >= date_start
    AND s.latitude IS NOT NULL
    AND s.longitude IS NOT NULL
    AND (3959 * acos(
      LEAST(1.0, cos(radians(user_lat)) * cos(radians(s.latitude)) *
      cos(radians(s.longitude) - radians(user_lng)) +
      sin(radians(user_lat)) * sin(radians(s.latitude)))
    )) <= radius_miles
    AND (
      query = '' OR
      to_tsvector('english', COALESCE(s.title, '') || ' ' || COALESCE(s.description, ''))
      @@ plainto_tsquery('english', query)
    )
  ORDER BY
    CASE WHEN query = '' THEN 0 ELSE -match_percent END,
    distance_miles ASC;
END;
$$ LANGUAGE plpgsql;
