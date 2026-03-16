-- Fix search_sales to return column names that match the app's salesApi.ts
-- Changes: sale_id -> id, adds external_id, company_name, zip_code

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
