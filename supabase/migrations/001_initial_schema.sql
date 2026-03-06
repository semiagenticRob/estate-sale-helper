-- Estate Helper - Initial Database Schema
-- Run this in your Supabase SQL Editor (supabase.com > your project > SQL Editor)

-- Estate sales table
CREATE TABLE sales (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  external_id TEXT UNIQUE,
  title TEXT NOT NULL,
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
  scraped_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Images associated with sales
CREATE TABLE sale_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sale_id UUID REFERENCES sales(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  caption TEXT,
  ai_tags TEXT[],
  position INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- User saved/starred sales
CREATE TABLE saved_sales (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sale_id UUID REFERENCES sales(id) ON DELETE CASCADE,
  device_id TEXT NOT NULL,
  remind_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(sale_id, device_id)
);

-- Indexes
CREATE INDEX idx_sales_zip ON sales(zip_code);
CREATE INDEX idx_sales_location ON sales(latitude, longitude);
CREATE INDEX idx_sales_dates ON sales(start_date, end_date);
CREATE INDEX idx_sales_description ON sales USING GIN(to_tsvector('english', description));
CREATE INDEX idx_images_sale ON sale_images(sale_id);
CREATE INDEX idx_images_tags ON sale_images USING GIN(ai_tags);

-- Full-text search function with distance and relevance scoring
CREATE OR REPLACE FUNCTION search_sales(
  query TEXT,
  user_lat DOUBLE PRECISION,
  user_lng DOUBLE PRECISION,
  radius_miles INTEGER DEFAULT 25,
  date_start DATE DEFAULT CURRENT_DATE,
  date_end DATE DEFAULT CURRENT_DATE + 7
)
RETURNS TABLE (
  sale_id UUID,
  title TEXT,
  description TEXT,
  city TEXT,
  state TEXT,
  address TEXT,
  start_date DATE,
  end_date DATE,
  url TEXT,
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  distance_miles DOUBLE PRECISION,
  match_percent INTEGER,
  header_image_url TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    s.id AS sale_id,
    s.title,
    s.description,
    s.city,
    s.state,
    s.address,
    s.start_date,
    s.end_date,
    s.url,
    s.latitude,
    s.longitude,
    (3959 * acos(
      cos(radians(user_lat)) * cos(radians(s.latitude)) *
      cos(radians(s.longitude) - radians(user_lng)) +
      sin(radians(user_lat)) * sin(radians(s.latitude))
    )) AS distance_miles,
    LEAST(100, (ts_rank_cd(
      to_tsvector('english', COALESCE(s.title, '') || ' ' || COALESCE(s.description, '')),
      plainto_tsquery('english', query)
    ) * 100)::INTEGER) AS match_percent,
    (SELECT si.image_url FROM sale_images si WHERE si.sale_id = s.id ORDER BY si.position LIMIT 1) AS header_image_url
  FROM sales s
  WHERE
    s.start_date <= date_end
    AND s.end_date >= date_start
    AND s.latitude IS NOT NULL
    AND s.longitude IS NOT NULL
    AND (3959 * acos(
      cos(radians(user_lat)) * cos(radians(s.latitude)) *
      cos(radians(s.longitude) - radians(user_lng)) +
      sin(radians(user_lat)) * sin(radians(s.latitude))
    )) <= radius_miles
    AND (
      query = '' OR
      to_tsvector('english', COALESCE(s.title, '') || ' ' || COALESCE(s.description, ''))
      @@ plainto_tsquery('english', query)
    )
  ORDER BY match_percent DESC, distance_miles ASC;
END;
$$ LANGUAGE plpgsql;
