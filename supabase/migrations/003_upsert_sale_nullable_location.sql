-- Migration 003: Update upsert_sale to allow NULL location
-- Sales whose address isn't disclosed yet (online auctions, by-appointment, upcoming)
-- are stored without coordinates so users can still view and save them.

CREATE OR REPLACE FUNCTION upsert_sale(
  p_external_id  TEXT,
  p_title        TEXT,
  p_company_name TEXT,
  p_address      TEXT,
  p_city         TEXT,
  p_state        TEXT,
  p_zip_code     TEXT,
  p_latitude     DOUBLE PRECISION,   -- NULL if address not yet available
  p_longitude    DOUBLE PRECISION,   -- NULL if address not yet available
  p_start_date   DATE,
  p_end_date     DATE,
  p_description  TEXT,
  p_url          TEXT
)
RETURNS UUID
LANGUAGE sql
SECURITY DEFINER
AS $$
  INSERT INTO sales (
    external_id, title, company_name, address, city, state, zip_code,
    location, start_date, end_date, description, url
  )
  VALUES (
    p_external_id, p_title, p_company_name, p_address,
    p_city, p_state, p_zip_code,
    CASE
      WHEN p_latitude IS NOT NULL AND p_longitude IS NOT NULL
      THEN ST_SetSRID(ST_MakePoint(p_longitude, p_latitude), 4326)::geography
      ELSE NULL
    END,
    p_start_date, p_end_date, p_description, p_url
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
    url          = EXCLUDED.url
  RETURNING id;
$$;
