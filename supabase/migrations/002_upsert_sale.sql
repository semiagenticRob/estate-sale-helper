-- Migration 002: upsert_sale function for the Python scraper
-- Accepts lat/lng as floats, converts to PostGIS geography internally
-- Run in Supabase SQL Editor

CREATE OR REPLACE FUNCTION upsert_sale(
  p_external_id    TEXT,
  p_title          TEXT,
  p_company_name   TEXT,
  p_address        TEXT,
  p_city           TEXT,
  p_state          TEXT,
  p_zip_code       TEXT,
  p_latitude       DOUBLE PRECISION,
  p_longitude      DOUBLE PRECISION,
  p_start_date     DATE,
  p_end_date       DATE,
  p_description    TEXT,
  p_url            TEXT
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
    ST_SetSRID(ST_MakePoint(p_longitude, p_latitude), 4326)::geography,
    p_start_date, p_end_date, p_description, p_url
  )
  ON CONFLICT (external_id) DO UPDATE SET
    title         = EXCLUDED.title,
    company_name  = EXCLUDED.company_name,
    address       = EXCLUDED.address,
    city          = EXCLUDED.city,
    state         = EXCLUDED.state,
    zip_code      = EXCLUDED.zip_code,
    location      = EXCLUDED.location,
    start_date    = EXCLUDED.start_date,
    end_date      = EXCLUDED.end_date,
    description   = EXCLUDED.description,
    url           = EXCLUDED.url
  RETURNING id;
$$;
